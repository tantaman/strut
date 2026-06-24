import { createFileRoute } from '@tanstack/react-router'

// Rindle live-query reads. Server-only: the handler (and its server imports) are stripped from the
// client bundle; the dynamic import keeps the daemon/SQL code out of the client graph entirely.
export const Route = createFileRoute('/api/rindle/query')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleRindleJson } = await import('../../server/rindle-api')
        return handleRindleJson('query', request)
      },
    },
  },
})
