import { createFileRoute } from '@tanstack/react-router'
import type { GenerateRequest } from '../../shared/generate'

// "✨ Generate slides" endpoint. Takes a natural-language description, returns a validated GeneratedDeck
// (server/generate.ts → Workers AI). Same two boundaries as /api/arrange:
//   1. LOGIN GATE — anonymous (guest) sessions and no-session requests are rejected. Guests can SEE the
//      Generate control (the client renders a sign-in nudge) but cannot spend the app's inference budget.
//      The client gate is UX only; THIS is the real one, mirroring server/session.ts's trust posture.
//   2. COST BOUND — the app pays for inference, so two layers cap it: a cheap per-isolate burst throttle
//      (below), and the AUTHORITATIVE durable daily quota in server/quota.ts (generate_usage, D1),
//      consumed before the model call and refunded if that call fails. Plus the GENERATE_LIMITS caps in
//      the adapter.
// We do NOT verify the user owns `deckId` here: the returned deck is just Markdown text, and APPLYING it
// flows through the authoritative slide-add mutations (server/rindle-api.ts), which independently reject
// edits to decks the user can't touch. The only thing this endpoint spends is inference, gated by auth +
// quota. (Generation is heavier than arrange, so the throttle is a touch tighter.)

// Per-isolate rolling-window burst throttle — a cheap brake on rapid-fire calls that also spares the
// durable quota a D1 write per hammered request. Best-effort (doesn't survive isolate recycling).
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

        // Pick the backend from the user's connected model: BYO OpenRouter (they pay) or app Workers AI.
        const { resolveModel } = await import('../../server/llm')
        const choice = await resolveModel(account.id)
        const byo = choice.kind === 'openrouter'

        // App-paid inference stays member-only (a guest can't spend the app's budget); BYO is open to any
        // session, guest or member, because the USER pays (OPENROUTER_PLAN.md "Decisions").
        if (!byo && account.isAnonymous) {
          return json({ error: 'sign_in_required' }, 401)
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

        // Durable daily quota — ONLY for the app-paid path. A BYO call spends the user's OWN OpenRouter
        // credits, so the app-cost ceiling doesn't apply; the burst throttle above still guards abuse.
        // Consumed BEFORE the model call so concurrent calls can't race past the cap.
        const now = Date.now()
        // `ai.meter === false` (BYO/unlimited) → skip. Otherwise consumeAiQuota charges the plan's window:
        // a paid plan's pooled monthly allowance, or the free tier's per-feature daily cap.
        const { getEntitlements, aiMetering } =
          await import('../../server/entitlements')
        const ai = aiMetering(await getEntitlements(account.id), 'generate')
        if (!byo && ai.meter) {
          const { consumeAiQuota } = await import('../../server/quota')
          let quota
          try {
            quota = await consumeAiQuota(account.id, now, 'generate', ai)
          } catch (err) {
            console.error('[generate] quota check failed:', err)
            return json({ error: 'internal' }, 500)
          }
          if (!quota.allowed) {
            return json(
              {
                error: 'quota_exceeded',
                message:
                  quota.window === 'month'
                    ? `You've used all ${quota.limit} AI messages in your plan this month. They reset at the start of next month.`
                    : `Daily AI slide-generation limit reached (${quota.limit}/day). Try again tomorrow.`,
              },
              429,
            )
          }
        }

        const { generateSlides, GenerateUnavailableError } =
          await import('../../server/generate')
        try {
          const deck = await generateSlides(b as GenerateRequest, choice)
          return json(deck, 200)
        } catch (err) {
          // The work didn't happen — refund the consumed unit (only if we metered it).
          if (!byo && ai.meter) {
            const { refundAiQuota } = await import('../../server/quota')
            await refundAiQuota(account.id, now, 'generate', ai.window).catch(
              () => {},
            )
          }
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
