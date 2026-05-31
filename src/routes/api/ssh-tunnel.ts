/**
 * SSH tunnel control — read status / update config for the workspace-managed
 * SSH tunnel to a remote Hermes Agent. Writes to ~/.hermes/ssh-tunnel.json and
 * reconciles the running tunnel live, so users can configure remote access from
 * Settings → Connection without editing files or restarting.
 *
 * Lets a workspace running on one device reach an agent on a VPS you already
 * connect to with `ssh hermes`.
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../server/auth-middleware'
import {
  applyTunnelConfig,
  getTunnelStatus,
  waitForLocalPort,
} from '../../server/ssh-tunnel'
import { requireJsonContentType } from '../../server/rate-limit'

function asPort(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const n = Number(value)
  if (!Number.isFinite(n) || n < 1 || n > 65535) return undefined
  return Math.floor(n)
}

export const Route = createFileRoute('/api/ssh-tunnel')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }
        return json(getTunnelStatus())
      },
      PUT: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck
        try {
          const body = (await request.json().catch(() => ({}))) as Record<
            string,
            unknown
          >

          // Validate before persisting. A port out of range is rejected; a
          // string field is trimmed (empty clears the override).
          for (const portKey of [
            'sshPort',
            'gatewayRemotePort',
            'dashboardRemotePort',
            'gatewayLocalPort',
            'dashboardLocalPort',
          ] as const) {
            if (
              body[portKey] !== undefined &&
              body[portKey] !== null &&
              body[portKey] !== '' &&
              asPort(body[portKey]) === undefined
            ) {
              return json(
                { error: `${portKey} must be a port between 1 and 65535` },
                { status: 400 },
              )
            }
          }

          const patch: Record<string, unknown> = {}
          if (body.enabled !== undefined) patch.enabled = Boolean(body.enabled)
          if (body.host !== undefined)
            patch.host = typeof body.host === 'string' ? body.host.trim() : ''
          if (body.identity !== undefined)
            patch.identity =
              typeof body.identity === 'string' ? body.identity.trim() : ''
          if (body.extraArgs !== undefined)
            patch.extraArgs =
              typeof body.extraArgs === 'string' ? body.extraArgs.trim() : ''
          if (body.sshPort !== undefined) patch.sshPort = asPort(body.sshPort)
          if (body.gatewayRemotePort !== undefined)
            patch.gatewayRemotePort = asPort(body.gatewayRemotePort)
          if (body.dashboardRemotePort !== undefined)
            patch.dashboardRemotePort = asPort(body.dashboardRemotePort)
          if (body.gatewayLocalPort !== undefined)
            patch.gatewayLocalPort = asPort(body.gatewayLocalPort)
          if (body.dashboardLocalPort !== undefined)
            patch.dashboardLocalPort = asPort(body.dashboardLocalPort)

          const status = applyTunnelConfig(patch)

          // If we just enabled a tunnel, give the forward a moment to come up
          // so the UI can report real reachability instead of "starting".
          let reachable: boolean | undefined
          if (status.enabled && status.host) {
            reachable = await waitForLocalPort(status.gatewayLocalPort, 4_000)
          }

          return json({ ok: true, reachable, ...getTunnelStatus() })
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Failed to update SSH tunnel settings'
          return json({ error: message }, { status: 500 })
        }
      },
    },
  },
})
