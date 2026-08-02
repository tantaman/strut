import { createFileRoute } from '@tanstack/react-router'
import type { GenerateRequest } from '../../shared/generate'

// "✨ Generate slides" endpoint. Takes a natural-language description, returns a validated GeneratedDeck
// (server/generate.ts → the shared model seam). The caller must have a connected OpenRouter key; a small
// per-isolate throttle protects the service while the caller pays inference directly.
// We do NOT verify the user owns `deckId` here: the returned deck is just Markdown text, and APPLYING it
// flows through the authoritative slide-add mutations (server/rindle-api.ts), which independently reject
// edits to decks the user can't touch. Generation is heavier than arrange, so its throttle is tighter.

// Per-isolate rolling-window burst throttle. Best-effort; it is not a billing meter.
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

export const Route = createFileRoute('/api/generate')({
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
        const b = body as Partial<GenerateRequest>
        if (typeof b.deckId !== 'string' || typeof b.prompt !== 'string') {
          return json({ error: 'bad_request' }, 400)
        }

        const { generateSlides, GenerateUnavailableError } =
          await import('../../server/generate')
        try {
          const deck = await generateSlides(b as GenerateRequest, choice)
          return json(deck, 200)
        } catch (err) {
          if (err instanceof GenerateUnavailableError) {
            return json({ error: 'ai_unavailable', message: err.message }, 503)
          }
          console.error('[generate] failed:', err)
          return json({ error: 'internal' }, 500)
        }
      },
    },
  },
})
