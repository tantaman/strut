import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/aamu/decks')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { readAamuDeckSnapshot, validAamuBearer } =
          await import('../../server/aamu-decks')
        const { drainAamuEventOutbox } =
          await import('../../server/aamu-events')

        if (!validAamuBearer(request)) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // A reconciliation request is also a retry opportunity for persisted
        // webhook events. Snapshot correctness does not depend on delivery.
        try {
          await drainAamuEventOutbox()
        } catch (error) {
          console.error(
            '[aamu-events] reconciliation-time drain failed:',
            error,
          )
        }
        return Response.json({ decks: await readAamuDeckSnapshot() })
      },
    },
  },
})
