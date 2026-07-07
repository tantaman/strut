import { createFileRoute } from '@tanstack/react-router'

// "Connect your model" — disconnect. POST: forget the current session's connected model. Idempotent — no
// session or no stored credential still returns { connected: false }. No key is ever involved (this only
// deletes a row), so it never touches MODEL_CRED_KEY.

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export const Route = createFileRoute('/api/model/disconnect')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { resolveSessionAccount } = await import('../../server/session')
        const account = await resolveSessionAccount(request)
        if (!account) return json({ connected: false }, 200)

        const { deleteCredential } = await import('../../server/modelCred')
        try {
          await deleteCredential(account.id)
        } catch (err) {
          console.error('[model.disconnect] failed:', err)
          return json({ error: 'internal' }, 500)
        }
        return json({ connected: false }, 200)
      },
    },
  },
})
