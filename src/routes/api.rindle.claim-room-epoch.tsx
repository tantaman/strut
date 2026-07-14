import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/rindle/claim-room-epoch')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleRindleJson } = await import('../../server/rindle-api')
        return handleRindleJson('claim-room-epoch', request)
      },
    },
  },
})
