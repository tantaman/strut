import { createFileRoute } from '@tanstack/react-router'
import type { NarrateRequest } from '../../shared/transcript'

// The NARRATE endpoint takes a talk transcript and returns a validated NarratedDeck
// (server/narrate.ts → the shared model seam). It requires the caller's connected OpenRouter key and keeps
// a small per-isolate throttle plus the NARRATE_LIMITS payload caps.
// We do NOT verify the user owns `deckId` here: the returned deck is just text, and APPLYING it flows
// through the authoritative slide mutations (server/rindle-api.ts), which independently reject edits to
// decks the user can't touch. The caller pays for the inference directly.

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()
function throttled(userId: string): boolean {
  const now = Date.now()
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(userId, recent)
    return true
  }
  recent.push(now)
  hits.set(userId, recent)
  return false
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export const Route = createFileRoute('/api/narrate')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { resolveSessionAccount } = await import('../../server/session')
        const account = await resolveSessionAccount(request)
        if (!account) {
          return json({ error: 'sign_in_required' }, 401)
        }

        const { resolveModel, modelRequired } = await import('../../server/llm')
        const choice = await resolveModel(account.id)
        if (!choice) {
          return json(modelRequired(), 402)
        }
        if (throttled(account.id)) {
          return json({ error: 'rate_limited' }, 429)
        }

        let body: unknown
        try {
          body = await request.json()
        } catch {
          return json({ error: 'bad_request' }, 400)
        }
        if (typeof body !== 'object' || body === null) {
          return json({ error: 'bad_request' }, 400)
        }
        const b = body as Partial<NarrateRequest>
        if (typeof b.deckId !== 'string' || typeof b.transcript !== 'string') {
          return json({ error: 'bad_request' }, 400)
        }
        // Don't spend inference on an empty transcript (the client disables submit on empty too).
        if (!b.transcript.trim()) {
          return json({ error: 'bad_request' }, 400)
        }

        const { narrateSlides, NarrateUnavailableError } =
          await import('../../server/narrate')
        try {
          const deck = await narrateSlides(b as NarrateRequest, choice)
          return json(deck, 200)
        } catch (err) {
          if (err instanceof NarrateUnavailableError) {
            return json({ error: 'ai_unavailable', message: err.message }, 503)
          }
          console.error('[narrate] failed:', err)
          return json({ error: 'internal' }, 500)
        }
      },
    },
  },
})
