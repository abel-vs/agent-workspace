import { describe, expect, it } from 'vitest'
import { buildSshArgs } from './ssh-tunnel'
import type { SshTunnelConfig } from './ssh-tunnel'

function cfg(overrides: Partial<SshTunnelConfig> = {}): SshTunnelConfig {
  return {
    enabled: true,
    host: 'hermes',
    gatewayRemotePort: 8642,
    dashboardRemotePort: 9119,
    gatewayLocalPort: 8642,
    dashboardLocalPort: 9119,
    ...overrides,
  }
}

describe('buildSshArgs', () => {
  it('builds a -N tunnel with both forwards and the host last', () => {
    const args = buildSshArgs(cfg())
    expect(args).toContain('-N')
    expect(args[args.length - 1]).toBe('hermes')
    expect(args).toContain('-L')
    expect(args).toContain('127.0.0.1:8642:127.0.0.1:8642')
    expect(args).toContain('127.0.0.1:9119:127.0.0.1:9119')
  })

  it('enables fail-fast + keepalive + batch (non-interactive) options', () => {
    const args = buildSshArgs(cfg())
    expect(args).toContain('BatchMode=yes')
    expect(args).toContain('ExitOnForwardFailure=yes')
    expect(args).toContain('ServerAliveInterval=15')
  })

  it('binds local forwards to 127.0.0.1 only', () => {
    const forwards = buildSshArgs(cfg()).filter((a) =>
      a.includes(':127.0.0.1:'),
    )
    expect(forwards.length).toBe(2)
    for (const f of forwards) expect(f.startsWith('127.0.0.1:')).toBe(true)
  })

  it('maps distinct local ports to remote ports', () => {
    const args = buildSshArgs(
      cfg({ gatewayLocalPort: 18642, dashboardLocalPort: 19119 }),
    )
    expect(args).toContain('127.0.0.1:18642:127.0.0.1:8642')
    expect(args).toContain('127.0.0.1:19119:127.0.0.1:9119')
  })

  it('includes ssh port and identity when provided', () => {
    const args = buildSshArgs(
      cfg({ sshPort: 2222, identity: '~/.ssh/id_ed25519' }),
    )
    expect(args).toContain('-p')
    expect(args).toContain('2222')
    expect(args).toContain('-i')
    expect(args).toContain('~/.ssh/id_ed25519')
  })

  it('appends extra args verbatim before the host', () => {
    const args = buildSshArgs(cfg({ extraArgs: '-o ProxyJump=bastion' }))
    const idx = args.indexOf('ProxyJump=bastion')
    expect(idx).toBeGreaterThan(-1)
    expect(idx).toBeLessThan(args.length - 1) // before the host
    expect(args[args.length - 1]).toBe('hermes')
  })

  it('omits -p / -i when not configured', () => {
    const args = buildSshArgs(cfg())
    expect(args).not.toContain('-p')
    expect(args).not.toContain('-i')
  })
})
