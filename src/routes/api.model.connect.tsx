import { createFileRoute } from '@tanstack/react-router'

// "Connect your model" — connect (BYOK). POST { apiKey, model? }: validate the key against OpenRouter,
// then envelope-encrypt + store it (server/modelCred.ts). Returns only { connected, provider, model } —
// NEVER the key.
//
// Two boundaries:
//   1. SESSION GATE — needs SOME session (guest or member); a connected key lets even a guest use the ✨
//      features on their own credits (OPENROUTER_PLAN.md "Decisions"). Only a fully session-less request
//      is rejected. This is deliberately looser than the app-paid AI routes (which reject guests): the
//      user is paying, not the app.
//   2. VALIDATION — we ping OpenRouter GET /api/v1/key with the supplied key before storing, so a typo'd
//      or revoked key fails fast here rather than at first ✨ use. 200 = valid; 401 = rejected.

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

// OpenRouter's key-info endpoint: 200 with the key present, 401 when absent/invalid. Cheapest way to
// verify a pasted key without spending inference.
const OPENROUTER_KEY_URL = 'https://openrouter.ai/api/v1/key'

export const Route = createFileRoute('/api/model/connect')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { resolveSessionAccount } = await import('../../server/session')
        const account = await resolveSessionAccount(request)
        if (!account) return json({ error: 'sign_in_required' }, 401)

        let body: unknown
        try {
          body = await request.json()
        } catch {
          return json({ error: 'bad_request' }, 400)
        }
        if (typeof body !== 'object' || body === null) {
          return json({ error: 'bad_request' }, 400)
        }
        const b = body as { apiKey?: unknown; model?: unknown }
        const apiKey = typeof b.apiKey === 'string' ? b.apiKey.trim() : ''
        // Optional: a specific OpenRouter model id (e.g. "anthropic/claude-3.5-sonnet"). Blank = let the
        // Phase-3 seam pick a default (OpenRouter's auto router). We only STORE it here.
        const model =
          typeof b.model === 'string' && b.model.trim() ? b.model.trim() : null
        if (!apiKey) {
          return json(
            { error: 'bad_request', message: 'An OpenRouter API key is required.' },
            400,
          )
        }

        // Validate against OpenRouter before persisting anything.
        let ok = false
        try {
          const res = await fetch(OPENROUTER_KEY_URL, {
            headers: { Authorization: `Bearer ${apiKey}` },
          })
          ok = res.ok
        } catch {
          return json(
            {
              error: 'validation_unavailable',
              message: 'Could not reach OpenRouter to verify the key. Try again.',
            },
            502,
          )
        }
        if (!ok) {
          return json(
            { error: 'invalid_key', message: 'OpenRouter rejected that API key.' },
            400,
          )
        }

        const { putCredential, ModelCredError } = await import(
          '../../server/modelCred'
        )
        try {
          await putCredential(account.id, { provider: 'openrouter', model, apiKey })
        } catch (err) {
          // MODEL_CRED_KEY unset/invalid → the feature isn't configured on this deployment.
          if (err instanceof ModelCredError) {
            return json({ error: 'not_configured', message: err.message }, 503)
          }
          console.error('[model.connect] failed:', err)
          return json({ error: 'internal' }, 500)
        }
        return json({ connected: true, provider: 'openrouter', model }, 200)
      },
    },
  },
})
