import { createFileRoute } from '@tanstack/react-router'

// Rindle authoritative mutations.
export const Route = createFileRoute('/api/rindle/mutate')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleRindleJson } = await import('../../server/rindle-api')
        return handleRindleJson('mutate', request)
      },
    },
  },
})
