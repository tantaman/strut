import { createFileRoute } from '@tanstack/react-router'

// "Connect your model" — status. GET whether the current session has a connected BYO model, and which
// (provider + model id), WITHOUT ever returning the key. Available to ANY session, guest or member: a
// guest can connect their own OpenRouter key and use the ✨ features on their own credits (the login gate
// only bites when there's no key to pay with — OPENROUTER_PLAN.md "Decisions"). No session at all → simply
// "not connected". Cheap: hasCredential does no crypto, so this never touches MODEL_CRED_KEY.

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

const DISCONNECTED = { connected: false, provider: null, model: null }

export const Route = createFileRoute('/api/model/status')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { resolveSessionAccount } = await import('../../server/session')
        const account = await resolveSessionAccount(request)
        if (!account) return json(DISCONNECTED, 200)

        const { hasCredential } = await import('../../server/modelCred')
        try {
          return json(await hasCredential(account.id), 200)
        } catch (err) {
          console.error('[model.status] failed:', err)
          return json(DISCONNECTED, 200)
        }
      },
    },
  },
})
