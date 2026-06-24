import { createFileRoute } from '@tanstack/react-router'

// Rindle one-shot reads.
export const Route = createFileRoute('/api/rindle/read')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleRindleJson } = await import('../../server/rindle-api')
        return handleRindleJson('read', request)
      },
    },
  },
})
