import { createFileRoute } from '@tanstack/react-router'

// Runtime client config, read by the browser before it opens the live-query WebSocket.
//
// The daemon WS URL is a RUNTIME value (set via wrangler `vars` / host env as RINDLE_DAEMON_WS), NOT
// baked into the client bundle — so one production build can target any daemon host without a rebuild.
// It's just a public endpoint URL, not a secret. See src/rindle/client.ts + docs/DEPLOY_CLOUDFLARE.md.
export const Route = createFileRoute('/api/rindle/config')({
  server: {
    handlers: {
      GET: () => Response.json({ wsUrl: process.env.RINDLE_DAEMON_WS ?? '' }),
    },
  },
})
