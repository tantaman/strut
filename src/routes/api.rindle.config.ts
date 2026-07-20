import { createFileRoute } from '@tanstack/react-router'

// Runtime client config, read by the browser before it opens the live-query WebSocket.
//
// The fleet WS URL is a RUNTIME value, not baked into the client bundle. A direct daemon URL remains
// an explicit legacy/debug bypass; the normal 0.7 path enables affinity at the stable fleet edge.
export const Route = createFileRoute('/api/rindle/config')({
  server: {
    handlers: {
      GET: () => {
        const direct = process.env.RINDLE_DAEMON_WS
        const fleet = process.env.RINDLE_FLEET_WS
        return Response.json({
          wsUrl: direct ?? fleet ?? '',
          affinity: !direct && Boolean(fleet),
        })
      },
    },
  },
})
