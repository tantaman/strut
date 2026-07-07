import { createFileRoute } from '@tanstack/react-router'
import type { ChatRequest } from '../../shared/chat'

// "✨ Chat" endpoint. Takes a running conversation + a deck digest and STREAMS a prose answer (server/chat.ts
// → Workers AI SSE). Same two boundaries as /api/arrange and /api/generate:
//   1. LOGIN GATE — anonymous (guest) sessions and no-session requests are rejected. Guests can SEE the Chat
//      panel (the client renders a sign-in nudge) but cannot spend the app's inference budget. The client
//      gate is UX only; THIS is the real one, mirroring server/session.ts's trust posture.
//   2. COST BOUND — the app pays for inference, so two layers cap it: a cheap per-isolate burst throttle
//      (below), and the AUTHORITATIVE durable daily quota in server/quota.ts (chat_usage, D1), consumed
//      before the model call and refunded ONLY if that call fails before any token streams. Plus the
//      CHAT_LIMITS caps in the adapter.
// We do NOT verify the user owns `deckId` here: the endpoint only READS a client-supplied digest and returns
// prose — advisor chat can't mutate the deck (Phase 1). The only thing it spends is inference, gated by auth
// + quota. The digest may name slides the user can see; that's their own deck's content, sent by their own
// client.
//
// Streaming contract: unlike arrange/generate (one-shot JSON), the OK response is `text/event-stream` — the
// raw Workers AI SSE, passed through untouched; the client parses `data: {"response":"…"}` frames. Errors
// (auth/throttle/quota/unavailable) are still one-shot JSON so the client can branch on them BEFORE it
// starts reading the stream.

// Per-isolate rolling-window burst throttle — a cheap brake on rapid-fire turns that also spares the durable
// quota a D1 write per hammered request. Chat is conversational, so bursts are natural; the window is a
// touch roomier than arrange's. Best-effort (doesn't survive isolate recycling); the durable per-user daily
// quota (server/quota.ts) is the real cost ceiling.
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 20
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

export const Route = createFileRoute('/api/chat')({
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
        const b = body as Partial<ChatRequest>
        if (
          typeof b.deckId !== 'string' ||
          !Array.isArray(b.messages) ||
          !Array.isArray(b.slides)
        ) {
          return json({ error: 'bad_request' }, 400)
        }

        // Durable daily quota — ONLY for the app-paid path. A BYO turn spends the user's OWN OpenRouter
        // credits, so the app-cost ceiling doesn't apply; the burst throttle above still guards abuse.
        // Consumed (one unit per user turn) BEFORE the model call so concurrent turns can't race the cap.
        const now = Date.now()
        if (!byo) {
          const { consumeChatQuota } = await import('../../server/quota')
          let quota
          try {
            quota = await consumeChatQuota(account.id, now)
          } catch (err) {
            console.error('[chat] quota check failed:', err)
            return json({ error: 'internal' }, 500)
          }
          if (!quota.allowed) {
            return json(
              {
                error: 'quota_exceeded',
                message: `Daily AI chat limit reached (${quota.limit}/day). Try again tomorrow.`,
              },
              429,
            )
          }
        }

        const { chatStream, ChatUnavailableError } =
          await import('../../server/chat')
        try {
          const stream = await chatStream(b as ChatRequest, choice)
          // The stream exists → the unit is legitimately spent. Hand the SSE straight to the client.
          return new Response(stream, {
            status: 200,
            headers: {
              'content-type': 'text/event-stream; charset=utf-8',
              'cache-control': 'no-cache, no-transform',
            },
          })
        } catch (err) {
          // Failed BEFORE any token streamed — the work didn't happen, so refund the consumed unit
          // (app-paid path only).
          if (!byo) {
            const { refundChatQuota } = await import('../../server/quota')
            await refundChatQuota(account.id, now).catch(() => {})
          }
          if (err instanceof ChatUnavailableError) {
            return json({ error: 'ai_unavailable', message: err.message }, 503)
          }
          console.error('[chat] failed:', err)
          return json({ error: 'internal' }, 500)
        }
      },
    },
  },
})
