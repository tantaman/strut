import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/rindle/room-boot')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleRindleJson } = await import('../../server/rindle-api')
        return handleRindleJson('room-boot', request)
      },
    },
  },
})
