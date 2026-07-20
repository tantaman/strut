import { createFileRoute } from '@tanstack/react-router'

// Runtime client config, read by the browser before it opens the live-query WebSocket.
//
// The browser uses the same public Rindle ingress as the server, with only the URL scheme changed.
// The database credential stays server-side.
function webSocketUrl(origin: string | undefined): string {
  if (!origin) return ''
  try {
    const url = new URL(origin)
    if (url.protocol === 'http:') url.protocol = 'ws:'
    else if (url.protocol === 'https:') url.protocol = 'wss:'
    else return ''
    return url.toString()
  } catch {
    return ''
  }
}

export const Route = createFileRoute('/api/rindle/config')({
  server: {
    handlers: {
      GET: () =>
        Response.json({
          wsUrl: webSocketUrl(process.env.RINDLE_URL),
          affinity: true,
        }),
    },
  },
})
