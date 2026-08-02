import { createFileRoute } from '@tanstack/react-router'
import { FONT_FAMILIES } from '../config'
import type { ChatActRequest } from '../../shared/chatAction'

// "✨ Chat" action-capable endpoint. Takes a conversation + deck grounding and STREAMS the turn
// (server/chatAct.ts chatActStream → the model seam): `data: {"response":"…"}` frames type the reply out,
// then one terminal `data: {"result":{say,actions}}` frame carries any validated changes the client applies.
// Like the prose-only twin (/api/chat) the OK response is `text/event-stream`; errors below stay one-shot
// JSON so the client can branch before it reads the stream. The caller must have a connected OpenRouter
// key. A small per-isolate throttle protects the service while the caller pays inference directly.
// We do NOT verify the user owns `deckId` here: the result is only a proposed change; APPLYING it flows
// through the authoritative slide/deck mutators (server/rindle-api.ts withSlideEditable/withDeckEditable),
// which independently reject edits the user can't make. The only thing this endpoint spends is inference.

// Per-isolate rolling-window burst throttle (mirrors /api/chat). Best-effort, not a billing meter.
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

        const {
          isStyleReferenceRequest,
          parseChatActPayload,
          ChatActPayloadError,
        } = await import('../../server/chatActPayload')
        const styleRequest = isStyleReferenceRequest(request)

        // An unpinned OpenRouter connection uses a multimodal default for photo-driven style turns.
        const { resolveModel, modelRequired } = await import('../../server/llm')
        const choice = await resolveModel(account.id, {
          purpose: styleRequest ? 'style' : 'general',
        })
        if (!choice) {
          return json(modelRequired(), 402)
        }
        if (throttled(account.id)) {
          return json({ error: 'rate_limited' }, 429)
        }

        let parsed: Awaited<ReturnType<typeof parseChatActPayload>>
        try {
          parsed = await parseChatActPayload(request)
        } catch (err) {
          if (err instanceof ChatActPayloadError) {
            return json(
              { error: 'bad_request', message: err.message },
              err.status,
            )
          }
          return json({ error: 'bad_request' }, 400)
        }
        const b: ChatActRequest = parsed.body

        const { chatActStream, ChatActUnavailableError } =
          await import('../../server/chatAct')
        try {
          const stream = await chatActStream(b, choice, {
            fonts: FONT_FAMILIES,
            images: parsed.images,
          })
          // Hand the SSE straight to the client: it types the reply out of `{response}` frames and applies
          // the terminal `{result}` frame.
          return new Response(stream, {
            status: 200,
            headers: {
              'content-type': 'text/event-stream; charset=utf-8',
              'cache-control': 'no-cache, no-transform',
            },
          })
        } catch (err) {
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
