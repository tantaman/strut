import { createFileRoute } from '@tanstack/react-router'
import type { ArrangeRequest } from '../../shared/arrange'

// "✨ AI Arrange" endpoint. Takes a deck digest + instruction, returns a validated ArrangementPlan
// (server/arrange.ts → the shared model seam). The caller must have a connected OpenRouter key; the client
// gate is UX only and this route is authoritative. A small per-isolate throttle protects the service from
// accidental rapid-fire requests while the user pays OpenRouter directly.
// Note we do NOT verify the user owns `deckId`/`slides` here: the returned plan is only reading order +
// a preset, and APPLYING it flows through the authoritative slide-edit mutations (server/rindle-api.ts
// `withSlideEditable`), which independently reject edits to slides the user can't touch. So the only
// thing this endpoint spends is the caller's own inference credits.

// Per-isolate rolling-window burst throttle. Best-effort; it deliberately is not a billing meter.
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 8
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

export const Route = createFileRoute('/api/arrange')({
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
        const b = body as Partial<ArrangeRequest>
        if (
          typeof b.deckId !== 'string' ||
          typeof b.instruction !== 'string' ||
          !Array.isArray(b.slides)
        ) {
          return json({ error: 'bad_request' }, 400)
        }

        const { arrange, ArrangeUnavailableError } =
          await import('../../server/arrange')
        try {
          const plan = await arrange(b as ArrangeRequest, choice)
          return json(plan, 200)
        } catch (err) {
          if (err instanceof ArrangeUnavailableError) {
            return json({ error: 'ai_unavailable', message: err.message }, 503)
          }
          console.error('[arrange] failed:', err)
          return json({ error: 'internal' }, 500)
        }
      },
    },
  },
})
