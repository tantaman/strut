import { createFileRoute } from '@tanstack/react-router'
import type { ArrangeRequest } from '../../shared/arrange'

// "✨ AI Arrange" endpoint. Takes a deck digest + instruction, returns a validated ArrangementPlan
// (server/arrange.ts → Workers AI). Two boundaries live here:
//   1. LOGIN GATE — anonymous (guest) sessions and no-session requests are rejected. Guests can SEE the
//      Arrange button (the client renders it disabled) but cannot spend the app's inference budget. The
//      client gate is UX only; THIS is the real one, mirroring server/session.ts's trust posture.
//   2. COST BOUND — a best-effort per-user throttle + the ARRANGE_LIMITS caps applied in the adapter.
// Note we do NOT verify the user owns `deckId`/`slides` here: the returned plan is only reading order +
// a preset, and APPLYING it flows through the authoritative slide-edit mutations (server/rindle-api.ts
// `withSlideEditable`), which independently reject edits to slides the user can't touch. So the only
// thing this endpoint spends is inference, which auth + the throttle gate.

// Per-isolate rolling-window throttle. Not a security control (login-gating is) — just a cheap brake on
// rapid-fire calls. A durable D1/Durable-Object quota is the production hardening (AI_ARRANGE_PLAN.md).
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
        if (!account || account.isAnonymous) {
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

        const { arrange, ArrangeUnavailableError } =
          await import('../../server/arrange')
        try {
          const plan = await arrange(b as ArrangeRequest)
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
