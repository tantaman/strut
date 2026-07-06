// Client side of "✨ Chat": the advisor panel's engine. A user turn + the current thread + a fresh deck
// digest → POST /api/chat → a token STREAM parsed and folded into a memory-only local `chat_message` row
// whose `content` grows per token. See AI_CHAT_PLAN.md.
//
// Two load-bearing decisions from the plan live here:
//   1. Storage is a LOCAL table (src/rindle/localSchema.ts): writes go through `store.writeLocal` (NOT
//      `app.mutate.*` — a replayable shared mutator may not touch a local table), reads through
//      `store.query.chat_message` (a named/remote query may not reference one). No sync, no undo, no
//      permissions — an advisor bounce is private, per-device, gone on reload.
//   2. Streaming is `writeLocal` per chunk, NOT `.folded`. `.folded` debounces writes to the SERVER; a
//      local table never syncs, so there's nothing to debounce. Tokens accumulate into `acc` and we
//      `writeLocal` the growing `content` directly — throttled to requestAnimationFrame so React
//      re-renders at frame rate, not per token. (`edit` wants the full prior row — we hold `prev`; for a
//      local table the engine keys by PK so an out-of-order flush still converges — RINDLE_NOTES #21.)

import {
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'
import { newId } from '../config'
import { buildDigest } from './aiArrange'
import { useStore } from '../rindle/RindleProvider'
import type { StrutStore } from '../rindle/client'
import type { ChatMessageRow } from '../rindle/localSchema'
import type { SlideDetail } from './deckDetail'
import type { ChatRequest, ChatTurn } from '../../shared/chat'

/** A thread row as the UI reads it (a full `chat_message` row). */
export type ChatMessage = ChatMessageRow

// ---- SSE parsing -----------------------------------------------------------------------------------

/** One parsed server-sent token event. */
export interface SseEvent {
  /** The `[DONE]` terminator was seen — stop reading. */
  done: boolean
  /** The token text to append (empty for a frame that carries no `response`). */
  delta: string
}

/** Parse ONE SSE line into a token event. Returns `null` for a line that carries no token — a blank event
 *  separator, a `:`-comment keep-alive, or any non-`data:` field — so the caller simply skips it. A
 *  `data: [DONE]` line returns `{ done: true }`; a `data: {"response":"…"}` frame (Workers AI's shape,
 *  passed through untouched by server/chat.ts) returns its text delta. An unparseable data payload returns
 *  `null` (tolerated — a partial/garbled frame is skipped, not fatal). Pure — unit-tested in chat.test.ts. */
export function parseSseDelta(line: string): SseEvent | null {
  const trimmed = line.trimEnd()
  if (!trimmed.startsWith('data:')) return null
  const payload = trimmed.slice('data:'.length).trim()
  if (!payload) return null
  if (payload === '[DONE]') return { done: true, delta: '' }
  try {
    const obj = JSON.parse(payload) as { response?: unknown }
    return { done: false, delta: typeof obj.response === 'string' ? obj.response : '' }
  } catch {
    return null
  }
}

// ---- send ------------------------------------------------------------------------------------------

/** The inputs a send needs beyond the user's text: which deck (scopes the thread), the current deck digest
 *  (grounding — rebuilt fresh per send so the model reasons about the CURRENT deck), and the prior thread
 *  as model-facing turns (history the server prepends to the new user turn). */
export interface SendContext {
  deckId: string
  slides: ChatRequest['slides']
  history: ChatTurn[]
}

async function friendlyError(res: Response): Promise<string> {
  if (res.status === 401) return 'Sign in to chat about your deck.'
  const b = (await res.json().catch(() => null)) as { message?: string } | null
  return (
    b?.message ??
    (res.status === 429
      ? 'Too many requests — wait a moment and try again.'
      : 'The AI advisor is unavailable right now.')
  )
}

/** Run one advisor turn: append the user turn + an empty streaming assistant turn to the local thread,
 *  POST the conversation, then fold the streamed tokens into the assistant row's `content` (throttled to
 *  rAF). Finalizes to `status:'done'`, or `status:'error'` with a friendly message on a non-OK response /
 *  stream failure. Never throws — every failure lands as an error row so the UI stays consistent. */
export async function sendChat(
  store: StrutStore,
  ctx: SendContext,
  userText: string,
): Promise<void> {
  const text = userText.trim()
  if (!text) return
  const now = Date.now()

  const userRow: ChatMessageRow = {
    id: newId(),
    deck_id: ctx.deckId,
    role: 'user',
    content: text,
    status: 'done',
    created: now,
  }
  // The assistant turn is stamped 1ms later so it always sorts AFTER its prompting user turn.
  const assistantRow: ChatMessageRow = {
    id: newId(),
    deck_id: ctx.deckId,
    role: 'assistant',
    content: '',
    status: 'streaming',
    created: now + 1,
  }

  await store.writeLocal((tx) => {
    tx.add('chat_message', userRow)
    tx.add('chat_message', assistantRow)
  })

  // Commit a patch to the assistant row. We hold the last-issued full row as `current` and update it
  // SYNCHRONOUSLY (before the writeLocal promise resolves) so the next commit's old-row is fresh; the
  // local engine keys `edit` by PK, so even if two flushes overlap they both write an absolute new row and
  // converge to the last-issued one (RINDLE_NOTES #21).
  let current = assistantRow
  const commit = (patch: Partial<ChatMessageRow>): Promise<void> => {
    const prev = current
    const next = { ...current, ...patch }
    current = next
    return store.writeLocal((tx) => tx.edit('chat_message', prev, next))
  }

  let res: Response
  try {
    const body: ChatRequest = {
      deckId: ctx.deckId,
      slides: ctx.slides,
      messages: [...ctx.history, { role: 'user', content: text }],
    }
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    })
  } catch {
    await commit({ status: 'error', content: 'Network error — try again.' })
    return
  }

  if (!res.ok || !res.body) {
    await commit({ status: 'error', content: await friendlyError(res) })
    return
  }

  // Fold the token stream into `content`, throttled to one write per animation frame. `acc` is the source
  // of truth; each frame flushes the LATEST `acc` (not each token), so a fast stream re-renders at frame
  // rate rather than per token.
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let acc = ''
  let frame: number | null = null
  const canRaf = typeof requestAnimationFrame === 'function'

  const flush = () => {
    frame = null
    void commit({ content: acc, status: 'streaming' })
  }
  const schedule = () => {
    if (frame !== null) return
    if (canRaf) frame = requestAnimationFrame(flush)
    else void commit({ content: acc, status: 'streaming' }) // no rAF (SSR/tests): write eagerly
  }
  const cancel = () => {
    if (frame !== null && canRaf) cancelAnimationFrame(frame)
    frame = null
  }

  try {
    let streamedDone = false
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? '' // keep any trailing partial line for the next chunk
      for (const line of lines) {
        const ev = parseSseDelta(line)
        if (!ev) continue
        if (ev.done) {
          streamedDone = true
          break
        }
        acc += ev.delta
        schedule()
      }
      if (streamedDone) break
    }
    // Flush a trailing partial line, if any completed the JSON without a newline.
    if (buffer.trim()) {
      const ev = parseSseDelta(buffer)
      if (ev && !ev.done) acc += ev.delta
    }
  } catch {
    // Mid-stream failure: keep whatever streamed, but mark the turn errored so the caret stops.
    cancel()
    await commit({
      content: acc || 'The response was interrupted — try again.',
      status: 'error',
    })
    return
  }

  cancel()
  // A stream that produced nothing (empty answer) still resolves cleanly — surface a gentle note.
  await commit({
    content: acc || '(no response)',
    status: 'done',
  })
}

// ---- useChat hook ----------------------------------------------------------------------------------

const EMPTY: readonly ChatMessage[] = []

export interface UseChat {
  /** The thread for this deck, in `created` order. Reactive — every `writeLocal` re-renders. */
  messages: readonly ChatMessage[]
  /** Send a user turn (grounded in the current `slides`). No-op while busy or for empty text. */
  send: (text: string) => void
  /** True while an assistant turn is still streaming. */
  busy: boolean
  /** Clear the whole thread for this deck (removes every local row). */
  clear: () => void
}

/** Read + drive the advisor thread for `deckId`, grounded in the live `slides`. Reads the memory-only
 *  `chat_message` local table off the LIVE store (never the SSR seed store, which doesn't know the table),
 *  so it's empty until the client boots and then fully reactive. `slides` is passed so each `send` rebuilds
 *  a fresh digest — the model always reasons about the CURRENT deck. */
export function useChat(deckId: string, slides: SlideDetail[]): UseChat {
  const store = useStore()

  // One live materialized view per (store, deckId); torn down when either changes or on unmount.
  const view = useMemo(() => {
    if (!store) return null
    return store.query.chat_message
      .where.deck_id(deckId)
      .orderBy('created', 'asc')
      .materialize()
  }, [store, deckId])
  useEffect(() => () => view?.destroy(), [view])

  const subscribe = useCallback(
    (onChange: () => void) => (view ? view.subscribe(() => onChange()) : () => {}),
    [view],
  )
  const getSnapshot = useCallback(
    (): readonly ChatMessage[] => (view ? view.data : EMPTY),
    [view],
  )
  const messages = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY)

  const busy = messages.some((m) => m.status === 'streaming')

  const send = useCallback(
    (text: string) => {
      if (!store || busy || !text.trim()) return
      // History = only settled turns — an in-flight/errored assistant row isn't real model context.
      const history: ChatTurn[] = messages
        .filter((m) => m.status === 'done')
        .map((m) => ({ role: m.role, content: m.content }))
      void sendChat(
        store,
        { deckId, slides: buildDigest(slides), history },
        text,
      )
    },
    [store, busy, messages, deckId, slides],
  )

  const clear = useCallback(() => {
    if (!store || !view) return
    const rows = view.data
    if (rows.length === 0) return
    void store.writeLocal((tx) => {
      for (const r of rows) tx.remove('chat_message', r)
    })
  }, [store, view])

  return { messages, send, busy, clear }
}
