/**
 * SSH tunnel manager.
 *
 * Lets the workspace reach a Hermes Agent that runs on a remote host (e.g. a
 * VPS you connect to with `ssh hermes`) without manually running `ssh -L`.
 * When configured, the workspace spawns and supervises an
 *
 *   ssh -N -L <localGateway>:127.0.0.1:<remoteGateway> \
 *          -L <localDashboard>:127.0.0.1:<remoteDashboard> <host>
 *
 * child process: keepalive pings, fail-fast on a dead forward, and automatic
 * restart with exponential backoff. The local forward ports default to the
 * gateway/dashboard ports the workspace already probes (8642 / 9119), so once
 * the tunnel is up the existing connection logic "just works".
 *
 * Configuration precedence (highest first):
 *   1. Runtime override persisted to ~/.hermes/ssh-tunnel.json (set from the
 *      Settings → Connection UI so remote users can configure without editing
 *      files or restarting).
 *   2. HERMES_SSH_* environment variables at process start.
 *   3. Disabled.
 *
 * Security note: the tunnel runs in BatchMode (key-based auth only — never an
 * interactive password prompt) and StrictHostKeyChecking=accept-new. Use an
 * ssh config alias / key for `host`; secrets are never stored by this module.
 */
import { spawn } from 'node:child_process'
import net from 'node:net'
import fs from 'node:fs'
import path from 'node:path'
import { getStateDir } from './workspace-state-dir'
import type { ChildProcess } from 'node:child_process'

const DEFAULT_GATEWAY_PORT = 8642
const DEFAULT_DASHBOARD_PORT = 9119
const MAX_BACKOFF_MS = 30_000

export type SshTunnelConfig = {
  /** Whether the tunnel should be running. */
  enabled: boolean
  /** ssh destination — an alias from ~/.ssh/config or `user@host`. */
  host: string
  /** Remote ssh port (`ssh -p`). Empty/undefined uses the ssh default. */
  sshPort?: number
  /** Identity file (`ssh -i`). */
  identity?: string
  /** Remote port the gateway listens on (forwarded from). */
  gatewayRemotePort: number
  /** Remote port the dashboard listens on (forwarded from). */
  dashboardRemotePort: number
  /** Local port the gateway forward is exposed on. */
  gatewayLocalPort: number
  /** Local port the dashboard forward is exposed on. */
  dashboardLocalPort: number
  /** Extra raw ssh arguments, space-separated. */
  extraArgs?: string
}

export type SshTunnelStatus = {
  /** Whether a tunnel is configured + switched on. */
  enabled: boolean
  /** True once a `host` is present (i.e. the config is actionable). */
  configured: boolean
  state: 'disabled' | 'starting' | 'running' | 'retrying' | 'error' | 'stopped'
  pid: number | null
  host: string
  sshPort?: number
  identity?: string
  extraArgs?: string
  gatewayLocalPort: number
  dashboardLocalPort: number
  gatewayRemotePort: number
  dashboardRemotePort: number
  startedAt: number | null
  restarts: number
  lastError: string | null
  lastExitCode: number | null
  /** Source of the active config, for the UI. */
  source: 'override' | 'env' | 'default'
}

/** Persisted config shape (~/.hermes/ssh-tunnel.json). All fields optional. */
type StoredConfig = Partial<{
  enabled: boolean
  host: string
  sshPort: number
  identity: string
  gatewayRemotePort: number
  dashboardRemotePort: number
  gatewayLocalPort: number
  dashboardLocalPort: number
  extraArgs: string
}>

function configPath(): string {
  return path.join(getStateDir(), 'ssh-tunnel.json')
}

function readStored(): StoredConfig {
  try {
    const raw = fs.readFileSync(configPath(), 'utf-8')
    const parsed = JSON.parse(raw) as unknown
    return parsed !== null && typeof parsed === 'object'
      ? (parsed as StoredConfig)
      : {}
  } catch {
    return {}
  }
}

function writeStored(next: StoredConfig): void {
  const file = configPath()
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 })
    fs.writeFileSync(file, JSON.stringify(next, null, 2), {
      encoding: 'utf-8',
      mode: 0o600,
    })
  } catch {
    console.warn(`[ssh-tunnel] failed to persist config to ${file}`)
  }
}

function envNumber(name: string): number | undefined {
  const raw = process.env[name]?.trim()
  if (!raw) return undefined
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined
}

/**
 * Resolve the effective tunnel config from the stored override + environment.
 * Exported for tests.
 */
export function resolveTunnelConfig(): SshTunnelConfig & {
  source: SshTunnelStatus['source']
} {
  const stored = readStored()
  const host = (stored.host ?? process.env.HERMES_SSH_HOST ?? '').trim()

  const gatewayRemotePort =
    stored.gatewayRemotePort ??
    envNumber('HERMES_SSH_GATEWAY_REMOTE_PORT') ??
    DEFAULT_GATEWAY_PORT
  const dashboardRemotePort =
    stored.dashboardRemotePort ??
    envNumber('HERMES_SSH_DASHBOARD_REMOTE_PORT') ??
    DEFAULT_DASHBOARD_PORT

  // `enabled` is explicit when stored; otherwise it's implied by having a host
  // configured via the environment.
  const enabled =
    typeof stored.enabled === 'boolean'
      ? stored.enabled && Boolean(host)
      : Boolean(host)

  const hasStoredFields =
    stored.host !== undefined || typeof stored.enabled === 'boolean'
  const source: SshTunnelStatus['source'] = hasStoredFields
    ? 'override'
    : process.env.HERMES_SSH_HOST
      ? 'env'
      : 'default'

  return {
    enabled,
    host,
    sshPort: stored.sshPort ?? envNumber('HERMES_SSH_PORT'),
    identity:
      (stored.identity ?? process.env.HERMES_SSH_IDENTITY)?.trim() || undefined,
    gatewayRemotePort,
    dashboardRemotePort,
    gatewayLocalPort:
      stored.gatewayLocalPort ??
      envNumber('HERMES_SSH_GATEWAY_LOCAL_PORT') ??
      gatewayRemotePort,
    dashboardLocalPort:
      stored.dashboardLocalPort ??
      envNumber('HERMES_SSH_DASHBOARD_LOCAL_PORT') ??
      dashboardRemotePort,
    extraArgs:
      (stored.extraArgs ?? process.env.HERMES_SSH_EXTRA_ARGS)?.trim() ||
      undefined,
    source,
  }
}

/**
 * Build the argument vector for the `ssh` child process. Exported for tests.
 * Local forwards bind to 127.0.0.1 only — never expose them on the LAN.
 */
export function buildSshArgs(cfg: SshTunnelConfig): Array<string> {
  const args = [
    '-N', // no remote command
    '-T', // no pty
    '-o',
    'BatchMode=yes', // never prompt for a password — key auth only
    '-o',
    'ExitOnForwardFailure=yes', // die if a forward can't bind, so we restart
    '-o',
    'ServerAliveInterval=15',
    '-o',
    'ServerAliveCountMax=3',
    '-o',
    'StrictHostKeyChecking=accept-new',
  ]
  if (cfg.sshPort) {
    args.push('-p', String(cfg.sshPort))
  }
  if (cfg.identity) {
    args.push('-i', cfg.identity)
  }
  args.push(
    '-L',
    `127.0.0.1:${cfg.gatewayLocalPort}:127.0.0.1:${cfg.gatewayRemotePort}`,
    '-L',
    `127.0.0.1:${cfg.dashboardLocalPort}:127.0.0.1:${cfg.dashboardRemotePort}`,
  )
  if (cfg.extraArgs) {
    for (const tok of cfg.extraArgs.split(/\s+/).filter(Boolean)) {
      args.push(tok)
    }
  }
  args.push(cfg.host)
  return args
}

// ── Runtime singleton (shared across the SSR bundle + any direct importer) ──

type TunnelRuntime = {
  child: ChildProcess | null
  state: SshTunnelStatus['state']
  pid: number | null
  startedAt: number | null
  lastError: string | null
  lastExitCode: number | null
  restarts: number
  /** Set when stopTunnel() is called so the exit handler doesn't restart. */
  intentionalStop: boolean
  retryTimer: ReturnType<typeof setTimeout> | null
  /** Fingerprint of the config the current child was started with. */
  fingerprint: string | null
}

const RUNTIME_KEY = '__hermes_ssh_tunnel_runtime__' as const

function runtime(): TunnelRuntime {
  const g = globalThis as typeof globalThis & {
    [RUNTIME_KEY]?: TunnelRuntime
  }
  if (!g[RUNTIME_KEY]) {
    g[RUNTIME_KEY] = {
      child: null,
      state: 'disabled',
      pid: null,
      startedAt: null,
      lastError: null,
      lastExitCode: null,
      restarts: 0,
      intentionalStop: false,
      retryTimer: null,
      fingerprint: null,
    }
  }
  return g[RUNTIME_KEY]
}

function fingerprintOf(cfg: SshTunnelConfig): string {
  return JSON.stringify([
    cfg.host,
    cfg.sshPort,
    cfg.identity,
    cfg.gatewayLocalPort,
    cfg.gatewayRemotePort,
    cfg.dashboardLocalPort,
    cfg.dashboardRemotePort,
    cfg.extraArgs,
  ])
}

function clearRetry(rt: TunnelRuntime): void {
  if (rt.retryTimer) {
    clearTimeout(rt.retryTimer)
    rt.retryTimer = null
  }
}

/** Spawn the ssh child for the given config and wire up supervision. */
function spawnTunnel(cfg: SshTunnelConfig): void {
  const rt = runtime()
  clearRetry(rt)
  rt.intentionalStop = false
  rt.fingerprint = fingerprintOf(cfg)
  rt.state = 'starting'

  const args = buildSshArgs(cfg)
  let child: ChildProcess
  try {
    child = spawn('ssh', args, { stdio: ['ignore', 'ignore', 'pipe'] })
  } catch (err) {
    rt.state = 'error'
    rt.child = null
    rt.pid = null
    rt.lastError = err instanceof Error ? err.message : 'failed to spawn ssh'
    return
  }

  rt.child = child
  rt.pid = child.pid ?? null
  rt.startedAt = Date.now()
  rt.lastError = null
  rt.lastExitCode = null
  // A forward that binds successfully keeps ssh alive with no output, so treat
  // a short-lived process that doesn't die as "running".
  rt.state = 'running'

  let stderrTail = ''
  child.stderr?.on('data', (chunk: Buffer) => {
    stderrTail = (stderrTail + chunk.toString('utf-8')).slice(-1024)
  })

  child.on('error', (err) => {
    rt.lastError =
      (err as NodeJS.ErrnoException).code === 'ENOENT'
        ? 'ssh binary not found on PATH'
        : err.message
    rt.state = 'error'
  })

  child.on('exit', (code, signal) => {
    rt.child = null
    rt.pid = null
    rt.lastExitCode = code
    if (stderrTail.trim()) rt.lastError = stderrTail.trim()

    if (rt.intentionalStop) {
      rt.state = 'stopped'
      return
    }
    // Unexpected exit — re-resolve config (it may have been disabled) and, if
    // still enabled, restart with exponential backoff.
    const next = resolveTunnelConfig()
    if (!next.enabled || !next.host) {
      rt.state = 'stopped'
      return
    }
    rt.restarts += 1
    rt.state = 'retrying'
    const delay = Math.min(2 ** Math.min(rt.restarts, 5) * 1000, MAX_BACKOFF_MS)
    if (!rt.lastError) {
      rt.lastError = signal
        ? `ssh exited via ${signal}`
        : `ssh exited with code ${code}`
    }
    rt.retryTimer = setTimeout(() => spawnTunnel(next), delay)
  })
}

/** Stop the tunnel (if running) and cancel any pending restart. */
export function stopTunnel(): void {
  const rt = runtime()
  rt.intentionalStop = true
  clearRetry(rt)
  if (rt.child) {
    rt.child.kill('SIGTERM')
  } else {
    rt.state = 'stopped'
  }
}

/**
 * Ensure the tunnel matches the resolved config: start it if enabled and not
 * already running with the same parameters; stop it if disabled.
 */
export function startConfiguredTunnel(): void {
  const cfg = resolveTunnelConfig()
  const rt = runtime()

  if (!cfg.enabled || !cfg.host) {
    if (rt.child || rt.retryTimer) stopTunnel()
    else rt.state = cfg.host ? 'stopped' : 'disabled'
    return
  }

  const fp = fingerprintOf(cfg)
  const alreadyCurrent =
    (rt.child || rt.retryTimer) && rt.fingerprint === fp && !rt.intentionalStop
  if (alreadyCurrent) return

  // Config changed or not running — (re)spawn.
  if (rt.child) {
    rt.intentionalStop = true
    rt.child.kill('SIGTERM')
  }
  rt.restarts = 0
  spawnTunnel(cfg)
}

/**
 * Persist a config change from the UI, then reconcile the running tunnel.
 * Only the provided fields are updated.
 */
export function applyTunnelConfig(patch: StoredConfig): SshTunnelStatus {
  const stored = readStored()
  const next: StoredConfig = { ...stored }
  for (const [k, v] of Object.entries(patch) as Array<
    [keyof StoredConfig, unknown]
  >) {
    if (v === undefined || v === null || v === '') {
      delete next[k]
    } else {
      // @ts-expect-error narrow per-key assignment
      next[k] = v
    }
  }
  writeStored(next)
  startConfiguredTunnel()
  return getTunnelStatus()
}

/** Current tunnel status for the API / UI. */
export function getTunnelStatus(): SshTunnelStatus {
  const cfg = resolveTunnelConfig()
  const rt = runtime()
  const state: SshTunnelStatus['state'] = !cfg.enabled
    ? cfg.host
      ? 'stopped'
      : 'disabled'
    : rt.state
  return {
    enabled: cfg.enabled,
    configured: Boolean(cfg.host),
    state,
    pid: rt.pid,
    host: cfg.host,
    sshPort: cfg.sshPort,
    identity: cfg.identity,
    extraArgs: cfg.extraArgs,
    gatewayLocalPort: cfg.gatewayLocalPort,
    dashboardLocalPort: cfg.dashboardLocalPort,
    gatewayRemotePort: cfg.gatewayRemotePort,
    dashboardRemotePort: cfg.dashboardRemotePort,
    startedAt: rt.startedAt,
    restarts: rt.restarts,
    lastError: rt.lastError,
    lastExitCode: rt.lastExitCode,
    source: cfg.source,
  }
}

/** Resolve once a TCP connection to 127.0.0.1:port succeeds (or times out). */
export function waitForLocalPort(
  port: number,
  timeoutMs = 4_000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve) => {
    const attempt = () => {
      const socket = net.connect({ host: '127.0.0.1', port })
      socket.once('connect', () => {
        socket.destroy()
        resolve(true)
      })
      socket.once('error', () => {
        socket.destroy()
        if (Date.now() >= deadline) resolve(false)
        else setTimeout(attempt, 250)
      })
    }
    attempt()
  })
}
