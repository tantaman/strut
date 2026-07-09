import { createFileRoute } from '@tanstack/react-router'
import { FONT_FAMILIES } from '../config'
import type { ChatActRequest } from '../../shared/chatAction'

// "✨ Chat" action-capable endpoint. Takes a conversation + deck grounding and STREAMS the turn
// (server/chatAct.ts chatActStream → the model seam): `data: {"response":"…"}` frames type the reply out,
// then one terminal `data: {"result":{say,actions}}` frame carries any validated changes the client applies.
// Like the prose-only twin (/api/chat) the OK response is `text/event-stream`; errors below stay one-shot
// JSON so the client can branch BEFORE it reads the stream. Same two boundaries as /api/arrange and
// /api/generate:
//   1. LOGIN GATE — anonymous (guest) sessions and no-session requests are rejected on the app-paid path;
//      a BYO OpenRouter caller (they pay) is allowed. Mirrors server/session.ts's trust posture.
//   2. COST BOUND — the app pays for inference, so a per-isolate burst throttle + the AUTHORITATIVE durable
//      daily quota (server/quota.ts) cap it. An action-capable chat turn is one model call, so it meters
//      exactly like a prose-only chat turn — it shares the SAME chat quota bucket (consumeChatQuota).
// We do NOT verify the user owns `deckId` here: the result is only a proposed change; APPLYING it flows
// through the authoritative slide/deck mutators (server/rindle-api.ts withSlideEditable/withDeckEditable),
// which independently reject edits the user can't make. The only thing this endpoint spends is inference.

// Per-isolate rolling-window burst throttle (mirrors /api/chat). Best-effort; the durable daily quota is
// the real ceiling.
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

export const Route = createFileRoute('/api/chat/act')({
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

        // App-paid inference stays member-only; BYO is open to any session because the USER pays.
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
        const b = body as Partial<ChatActRequest>
        if (
          typeof b.deckId !== 'string' ||
          !Array.isArray(b.messages) ||
          typeof b.deckContext !== 'string' ||
          !Array.isArray(b.slideIds)
        ) {
          return json({ error: 'bad_request' }, 400)
        }

        // Durable daily quota — ONLY for the app-paid path, and the SAME bucket as the advisor (an Edit
        // turn is a chat turn). Consumed BEFORE the model call so concurrent turns can't race the cap.
        const now = Date.now()
        // Pro (like BYO) lifts the app-paid daily cap; `ai.meter === false` means unlimited.
        const { getEntitlements, aiMetering } =
          await import('../../server/entitlements')
        const ai = aiMetering(await getEntitlements(account.id), 'chat')
        if (!byo && ai.meter) {
          const { consumeChatQuota } = await import('../../server/quota')
          let quota
          try {
            quota = await consumeChatQuota(account.id, now, undefined, ai.limit)
          } catch (err) {
            console.error('[chat/act] quota check failed:', err)
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

        const { chatActStream, ChatActUnavailableError } =
          await import('../../server/chatAct')
        try {
          const stream = await chatActStream(b as ChatActRequest, choice, {
            fonts: FONT_FAMILIES,
          })
          // The stream exists → the unit is legitimately spent. Hand the SSE straight to the client: it
          // types the reply out of `{response}` frames and applies the terminal `{result}` frame.
          return new Response(stream, {
            status: 200,
            headers: {
              'content-type': 'text/event-stream; charset=utf-8',
              'cache-control': 'no-cache, no-transform',
            },
          })
        } catch (err) {
          // Failed BEFORE any token streamed — the work didn't happen, so refund the consumed unit
          // (only if we metered it).
          if (!byo && ai.meter) {
            const { refundChatQuota } = await import('../../server/quota')
            await refundChatQuota(account.id, now).catch(() => {})
          }
          if (err instanceof ChatActUnavailableError) {
            return json({ error: 'ai_unavailable', message: err.message }, 503)
          }
          console.error('[chat/act] failed:', err)
          return json({ error: 'internal' }, 500)
        }
      },
    },
  },
})
