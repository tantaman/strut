import { createFileRoute } from '@tanstack/react-router'
import type { NarrateRequest } from '../../shared/transcript'

// "🎙️ From a recording" — the NARRATE endpoint. Takes a talk transcript, returns a validated NarratedDeck
// (server/narrate.ts → the shared model seam). Same two boundaries as /api/generate:
//   1. MODEL GATE — the caller must have a model to spend: their own connected key (open to guests — the
//      USER pays), or a paid plan that includes app-paid inference (server/llm.ts resolveModel → null ⇒
//      402). No free app-paid tier.
//   2. COST BOUND — a cheap per-isolate burst throttle plus the AUTHORITATIVE durable daily quota in
//      server/quota.ts (narrate_usage, D1), consumed before the model call and refunded if it fails. Plus
//      the NARRATE_LIMITS caps in the adapter.
// We do NOT verify the user owns `deckId` here: the returned deck is just text, and APPLYING it flows
// through the authoritative slide mutations (server/rindle-api.ts), which independently reject edits to
// decks the user can't touch. The only thing this endpoint spends is inference, gated by auth + quota.

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

        // Pick the backend from the user's connected model: BYO OpenRouter (they pay) or, for a paid
        // plan, the app's own default. Null = neither, so there is nothing this caller may spend.
        const { resolveModel } = await import('../../server/llm')
        const choice = await resolveModel(account.id)
        if (!choice) {
          const { modelRequired } = await import('../../server/entitlements')
          return json(modelRequired(), 402)
        }
        const byo = choice.kind === 'openrouter'
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

        // Durable daily quota — ONLY for the app-paid path (a BYO call spends the user's OWN credits).
        // Consumed BEFORE the model call so concurrent calls can't race past the cap.
        const now = Date.now()
        const { getEntitlements, aiMetering } =
          await import('../../server/entitlements')
        const ai = aiMetering(await getEntitlements(account.id), 'narrate')
        if (!byo && ai.meter) {
          const { consumeAiQuota } = await import('../../server/quota')
          let quota
          try {
            quota = await consumeAiQuota(account.id, now, 'narrate', ai)
          } catch (err) {
            console.error('[narrate] quota check failed:', err)
            return json({ error: 'internal' }, 500)
          }
          if (!quota.allowed) {
            return json(
              {
                error: 'quota_exceeded',
                message:
                  quota.window === 'month'
                    ? `You've used all ${quota.limit} AI messages in your plan this month. They reset at the start of next month.`
                    : `Daily limit reached (${quota.limit}/day) for generating decks from recordings. Try again tomorrow.`,
              },
              429,
            )
          }
        }

        const { narrateSlides, NarrateUnavailableError } =
          await import('../../server/narrate')
        try {
          const deck = await narrateSlides(b as NarrateRequest, choice)
          return json(deck, 200)
        } catch (err) {
          // The work didn't happen — refund the consumed unit (only if we metered it).
          if (!byo && ai.meter) {
            const { refundAiQuota } = await import('../../server/quota')
            await refundAiQuota(account.id, now, 'narrate', ai.window).catch(
              () => {},
            )
          }
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
