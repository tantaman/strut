import { createFileRoute } from '@tanstack/react-router'
import { rindleWsUrl } from '../rindle/wsUrl.ts'

// Runtime client config, read by the browser before it opens the live-query WebSocket.
//
// Aamu deployments leave RINDLE_DAEMON_WS empty so every tenant stays on its
// own origin (ile.aamu.app → wss://ile.aamu.app/slides/rindle). Standalone
// deployments may still provide an explicit runtime override.
export const Route = createFileRoute('/api/rindle/config')({
  server: {
    handlers: {
      GET: ({ request }) => Response.json({ wsUrl: rindleWsUrl(request) }),
    },
  },
})
