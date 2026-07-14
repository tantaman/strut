import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/rindle/apply-row-change-txn')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleRindleJson } = await import('../../server/rindle-api')
        return handleRindleJson('apply-row-change-txn', request)
      },
    },
  },
})
