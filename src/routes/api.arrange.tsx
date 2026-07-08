import { createFileRoute } from '@tanstack/react-router'
import type { ArrangeRequest } from '../../shared/arrange'

// "✨ AI Arrange" endpoint. Takes a deck digest + instruction, returns a validated ArrangementPlan
// (server/arrange.ts → Workers AI). Two boundaries live here:
//   1. LOGIN GATE — anonymous (guest) sessions and no-session requests are rejected. Guests can SEE the
//      Arrange button (the client renders it disabled) but cannot spend the app's inference budget. The
//      client gate is UX only; THIS is the real one, mirroring server/session.ts's trust posture.
//   2. COST BOUND — the app pays for inference, so two layers cap it: a cheap per-isolate burst throttle
//      (below) as a first-line filter, and the AUTHORITATIVE durable daily quota in server/quota.ts (D1),
//      consumed before the model call and refunded if that call fails. Plus the ARRANGE_LIMITS payload
//      caps in the adapter.
// Note we do NOT verify the user owns `deckId`/`slides` here: the returned plan is only reading order +
// a preset, and APPLYING it flows through the authoritative slide-edit mutations (server/rindle-api.ts
// `withSlideEditable`), which independently reject edits to slides the user can't touch. So the only
// thing this endpoint spends is inference, which auth + the quota gate.

// Per-isolate rolling-window burst throttle — a cheap brake on rapid-fire calls that also spares the
// durable quota a D1 write per hammered request. Best-effort (doesn't survive isolate recycling); the
// durable per-user daily quota (server/quota.ts) is the real cost ceiling.
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
        const b = body as Partial<ArrangeRequest>
        if (
          typeof b.deckId !== 'string' ||
          typeof b.instruction !== 'string' ||
          !Array.isArray(b.slides)
        ) {
          return json({ error: 'bad_request' }, 400)
        }

        // Durable daily quota — ONLY for the app-paid path. A BYO call spends the user's OWN OpenRouter
        // credits, so the app-cost ceiling doesn't apply; the burst throttle above still guards abuse.
        // Consumed BEFORE the model call so concurrent calls can't race past the cap.
        const now = Date.now()
        // Pro (like BYO) lifts the app-paid daily cap. Resolve the plan once; `ai.meter === false`
        // means unlimited → skip the quota, and Pro may also carry a raised `ai.limit`.
        const { getEntitlements, aiMetering } =
          await import('../../server/entitlements')
        const ai = aiMetering(await getEntitlements(account.id), 'arrange')
        if (!byo && ai.meter) {
          const { consumeArrangeQuota } = await import('../../server/quota')
          let quota
          try {
            quota = await consumeArrangeQuota(
              account.id,
              now,
              undefined,
              ai.limit,
            )
          } catch (err) {
            console.error('[arrange] quota check failed:', err)
            return json({ error: 'internal' }, 500)
          }
          if (!quota.allowed) {
            return json(
              {
                error: 'quota_exceeded',
                message: `Daily AI arrange limit reached (${quota.limit}/day). Try again tomorrow.`,
              },
              429,
            )
          }
        }

        const { arrange, ArrangeUnavailableError } =
          await import('../../server/arrange')
        try {
          const plan = await arrange(b as ArrangeRequest, choice)
          return json(plan, 200)
        } catch (err) {
          // The work didn't happen — refund the consumed unit (only if we metered it).
          if (!byo && ai.meter) {
            const { refundArrangeQuota } = await import('../../server/quota')
            await refundArrangeQuota(account.id, now).catch(() => {})
          }
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
