import { createFileRoute } from '@tanstack/react-router'
import type { ChatRequest } from '../../shared/chat'

// "✨ Chat" endpoint. Takes a running conversation + append-only deck context and streams a prose answer
// from the caller's connected OpenRouter model. Everyone can see the Chat panel, but this route is the
// authoritative model gate. A small per-isolate throttle protects the service; the caller pays inference.
// We do NOT verify the user owns `deckId` here: the endpoint only READS client-supplied context and returns
// prose — advisor chat can't mutate the deck.
//
// Streaming contract: unlike arrange/generate (one-shot JSON), the OK response is `text/event-stream` — the
// normalized SSE; the client parses `data: {"response":"…"}` frames. Errors remain one-shot JSON so the
// client can branch before it starts reading the stream.

// Per-isolate rolling-window burst throttle. Chat is conversational, so this is roomier than arrange's.
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
        const b = body as Partial<ChatRequest>
        if (
          typeof b.deckId !== 'string' ||
          !Array.isArray(b.messages) ||
          typeof b.deckContext !== 'string'
        ) {
          return json({ error: 'bad_request' }, 400)
        }

        const { chatStream, ChatUnavailableError } =
          await import('../../server/chat')
        try {
          const stream = await chatStream(b as ChatRequest, choice)
          // The provider stream exists; hand the normalized SSE straight to the client.
          return new Response(stream, {
            status: 200,
            headers: {
              'content-type': 'text/event-stream; charset=utf-8',
              'cache-control': 'no-cache, no-transform',
            },
          })
        } catch (err) {
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
