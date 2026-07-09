// Client side of "✨ Chat": the panel's engine. A user turn + the current thread + append-only narrated deck
// context stream into a memory-only local `chat_message` row whose `content` grows per token. The product
// path uses the action-capable stream: the assistant can answer with prose only, or return normalized
// actions that apply through the same one-undo dispatcher as the rest of the editor.
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
  useState,
  useSyncExternalStore,
} from 'react'
import { newId } from '../config'
import { slideText } from './aiArrange'
import { dispatchActions } from './aiChatActions'
import type { DispatchCtx, DispatchOutcome } from './aiChatActions'
import { resolveBackground, resolveSurface, resolveTheme } from './types'
import { track } from '../lib/analytics'
import { notifyUsageChanged } from '../lib/usage'
import { useMutate, useStore } from '../rindle/RindleProvider'
import { useHistory } from './UndoProvider'
import type { StrutStore } from '../rindle/client'
import type { ChatMessageRow } from '../rindle/localSchema'
import type { ThemeDeck } from './aiTheme'
import type { SlideDetail } from './deckDetail'
import type { DeckChatContext } from './chatNarration'
import type { ChatRequest, ChatTurn } from '../../shared/chat'
import { appPath } from '../../shared/appPath'
import type {
  ChatAction,
  ChatActRequest,
  ChatActResult,
  ChatActSlide,
  ChatActTheme,
} from '../../shared/chatAction'

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
    return {
      done: false,
      delta: typeof obj.response === 'string' ? obj.response : '',
    }
  } catch {
    return null
  }
}

/** One parsed action-capable chat SSE line. The stream reuses the advisor's `{response}` prose frames
 *  (typed out live) but adds a terminal `{result}` frame carrying the server-validated `{ say, action }` —
 *  the authoritative value to APPLY. `done` marks the `[DONE]` terminator. */
export interface ActEvent {
  done: boolean
  delta: string
  result: ChatActResult | null
}

/** Parse ONE action-capable chat SSE line (src/routes/api.chat.act.tsx). Returns null for a line carrying
 *  nothing (blank / comment / non-`data:` / garbled). `[DONE]` → `{ done: true }`; a `{"result":…}` frame
 *  → its validated result; a `{"response":"…"}` frame → its prose delta. Pure — unit-tested in
 *  chat.test.ts. */
export function parseActLine(line: string): ActEvent | null {
  const trimmed = line.trimEnd()
  if (!trimmed.startsWith('data:')) return null
  const payload = trimmed.slice('data:'.length).trim()
  if (!payload) return null
  if (payload === '[DONE]') return { done: true, delta: '', result: null }
  try {
    const obj = JSON.parse(payload) as { response?: unknown; result?: unknown }
    if (obj.result && typeof obj.result === 'object') {
      const r = obj.result as { say?: unknown; actions?: unknown }
      return {
        done: false,
        delta: '',
        result: {
          say: typeof r.say === 'string' ? r.say : '',
          actions: Array.isArray(r.actions)
            ? (r.actions as ChatActResult['actions'])
            : [],
        },
      }
    }
    return {
      done: false,
      delta: typeof obj.response === 'string' ? obj.response : '',
      result: null,
    }
  } catch {
    return null
  }
}

/** The sub-status shown under the streamed reply while the turn's actions are being APPLIED — the other
 *  silent gap, since `generate`/`arrange`/`add_image` make a second round-trip after the prose finishes. A
 *  multi-action turn shows a count; a single action shows what it's doing. */
export function applyNote(actions: ChatAction[]): string {
  if (actions.length !== 1)
    return actions.length > 1
      ? `Applying ${actions.length} changes…`
      : 'Applying…'
  const action = actions[0]
  switch (action.kind) {
    case 'set_theme':
      return 'Applying theme…'
    case 'set_body':
      return 'Rewriting the slide…'
    case 'create_slide':
      return 'Adding a slide…'
    case 'generate':
      return action.count
        ? `Generating ${action.count} slides…`
        : 'Generating slides…'
    case 'arrange':
      return 'Rearranging slides…'
    case 'add_image':
      return action.source === 'generate'
        ? 'Generating an image…'
        : action.source === 'search'
          ? 'Finding a photo…'
          : 'Adding the image…'
    case 'add_web':
      return 'Embedding the page…'
    case 'add_artifact':
      return 'Building the artifact…'
    default:
      return 'Applying…'
  }
}

// ---- send ------------------------------------------------------------------------------------------

/** The inputs a send needs beyond the user's text: which deck (scopes the thread), the append-only deck
 *  context, and the prior thread as model-facing turns (history the server prepends to the new user turn). */
export interface SendContext {
  deckId: string
  deckContext: string
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
    note: '',
    created: now,
  }
  // The assistant turn is stamped 1ms later so it always sorts AFTER its prompting user turn.
  const assistantRow: ChatMessageRow = {
    id: newId(),
    deck_id: ctx.deckId,
    role: 'assistant',
    content: '',
    status: 'streaming',
    note: '',
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
      deckContext: ctx.deckContext,
      messages: [...ctx.history, { role: 'user', content: text }],
    }
    res = await fetch(appPath('/api/chat'), {
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

// ---- Action-capable chat turn ----------------------------------------------------------------------

/** The extra grounding an action-capable turn carries beyond the advisor's SendContext (see
 *  shared/chatAction.ts): the deck's resolved theme + the active slide's full text. */
export interface ActionSendContext {
  deckId: string
  deckContext: string
  slideIds: ChatActRequest['slideIds']
  history: ChatTurn[]
  theme?: ChatActTheme
  activeSlide?: ChatActSlide
}

/** Run ONE action-capable chat turn: append the user turn + a working assistant turn, POST /api/chat/act,
 *  then STREAM the reply into the assistant row's `content` (the `{response}` frames — same live typing as
 *  the advisor) and DISPATCH the terminal `{result}` frame's action (via the injected `dispatch`, which
 *  closes over the live mutators + history), showing an "Applying…" note on the row while that apply
 *  (possibly a second round-trip) runs. Returns the applied action's undo label (for the Undo chip) or null
 *  when nothing was applied. Never throws — every failure lands as an error row so the UI stays consistent. */
export async function sendChatAction(
  store: StrutStore,
  ctx: ActionSendContext,
  userText: string,
  dispatch: (actions: ChatAction[]) => Promise<DispatchOutcome>,
): Promise<{ label: string } | null> {
  const text = userText.trim()
  if (!text) return null
  const now = Date.now()

  const userRow: ChatMessageRow = {
    id: newId(),
    deck_id: ctx.deckId,
    role: 'user',
    content: text,
    status: 'done',
    note: '',
    created: now,
  }
  // Stamped 1ms later so it always sorts AFTER its prompting user turn. `streaming` shows the thinking
  // dots until the first token, then the reply types in; `note` carries the apply sub-status.
  const assistantRow: ChatMessageRow = {
    id: newId(),
    deck_id: ctx.deckId,
    role: 'assistant',
    content: '',
    status: 'streaming',
    note: '',
    created: now + 1,
  }
  await store.writeLocal((tx) => {
    tx.add('chat_message', userRow)
    tx.add('chat_message', assistantRow)
  })

  let current = assistantRow
  const commit = (patch: Partial<ChatMessageRow>): Promise<void> => {
    const prev = current
    const next = { ...current, ...patch }
    current = next
    return store.writeLocal((tx) => tx.edit('chat_message', prev, next))
  }

  let res: Response
  try {
    const body: ChatActRequest = {
      deckId: ctx.deckId,
      deckContext: ctx.deckContext,
      slideIds: ctx.slideIds,
      messages: [...ctx.history, { role: 'user', content: text }],
      theme: ctx.theme,
      activeSlide: ctx.activeSlide,
    }
    res = await fetch(appPath('/api/chat/act'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    })
  } catch {
    await commit({ status: 'error', content: 'Network error — try again.' })
    return null
  }

  if (!res.ok || !res.body) {
    await commit({ status: 'error', content: await friendlyError(res) })
    return null
  }

  // Fold the reply's `{response}` frames into `content` (throttled to a frame, like the advisor) so it types
  // out live; capture the terminal `{result}` frame — the validated { say, action } we then apply.
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let acc = ''
  let result: ChatActResult | null = null
  let frame: number | null = null
  const canRaf = typeof requestAnimationFrame === 'function'
  const flush = () => {
    frame = null
    void commit({ content: acc, status: 'streaming' })
  }
  const schedule = () => {
    if (frame !== null) return
    if (canRaf) frame = requestAnimationFrame(flush)
    else void commit({ content: acc, status: 'streaming' })
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
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const ev = parseActLine(line)
        if (!ev) continue
        if (ev.done) {
          streamedDone = true
          break
        }
        if (ev.result) result = ev.result
        else if (ev.delta) {
          acc += ev.delta
          schedule()
        }
      }
      if (streamedDone) break
    }
    if (buffer.trim()) {
      const ev = parseActLine(buffer)
      if (ev?.result) result = ev.result
      else if (ev && !ev.done) acc += ev.delta
    }
  } catch {
    cancel()
    await commit({
      content: acc || 'The response was interrupted — try again.',
      status: 'error',
    })
    return null
  }
  cancel()

  // The result frame's `say` is authoritative (normalized/clamped server-side); fall back to the streamed
  // prose if the frame never arrived.
  const say = (result?.say ?? acc).trim()
  const actions = result?.actions ?? []

  // Advice-only turn (no actions) — render the answer like the advisor would.
  if (actions.length === 0) {
    await commit({
      content: say || acc || '(no change needed)',
      status: 'done',
    })
    return null
  }

  // Apply phase — the reply is already on screen; show what's happening while the apply (for generate /
  // arrange / add_image, a second round-trip) runs, so the turn is never silent.
  await commit({
    content: say || acc,
    note: applyNote(actions),
    status: 'streaming',
  })
  let outcome: DispatchOutcome
  try {
    outcome = await dispatch(actions)
  } catch {
    outcome = { ok: false, error: 'Could not apply that change.' }
  }

  if (outcome.ok) {
    await commit({
      content: say || `Done — ${outcome.label.toLowerCase()}.`,
      note: '',
      status: 'done',
    })
    return { label: outcome.label }
  }
  // The model answered but the apply failed (e.g. a delegated /api/arrange error) — keep the answer,
  // append the reason, mark it errored.
  await commit({
    content: (say ? say + '\n\n' : '') + `⚠️ ${outcome.error}`,
    note: '',
    status: 'error',
  })
  return null
}

// ---- useChat hook ----------------------------------------------------------------------------------

const EMPTY: readonly ChatMessage[] = []

export interface UseChat {
  /** The thread for this deck, in `created` order. Reactive — every `writeLocal` re-renders. */
  messages: readonly ChatMessage[]
  /** Send one chat turn. The model may answer only, or apply normalized deck changes. */
  send: (text: string) => void
  /** True while an assistant turn is still streaming / an edit is being applied. */
  busy: boolean
  /** Clear the whole thread for this deck (removes every local row). */
  clear: () => void
  /** After a successful AI-applied change, the undo affordance ({ label }); null otherwise. */
  undoTip: { label: string } | null
  /** Undo the last AI-applied change (a shortcut for Cmd/Ctrl+Z) and clear the chip. */
  undoLast: () => void
}

/** Extra editor context action-capable chat needs to ground + apply an action: the deck row (for the resolved
 *  theme + theme before-values) and the currently-active slide (the natural `set_body` target). */
export interface ChatEditContext {
  deck?: ThemeDeck | null
  activeSlide?: SlideDetail | null
  deckContext?: DeckChatContext | null
}

/** Build the action grounding: the deck's CURRENT resolved theme (so "make it warmer" is grounded) and the
 *  active slide's FULL body text (so a body rewrite sees the whole slide, not the 240-char digest). */
function buildActGrounding(
  deck: ThemeDeck | null,
  activeSlide: SlideDetail | null,
): { theme?: ChatActTheme; activeSlide?: ChatActSlide } {
  const out: { theme?: ChatActTheme; activeSlide?: ChatActSlide } = {}
  if (deck) {
    const rt = resolveTheme(deck)
    out.theme = {
      background: resolveBackground(undefined, deck.background ?? undefined),
      surface: resolveSurface(undefined, deck.surface ?? undefined),
      headingColor: rt.headingColor,
      bodyColor: rt.bodyColor,
      headingFont: rt.headingFont,
      bodyFont: rt.bodyFont,
    }
  }
  if (activeSlide) {
    out.activeSlide = { id: activeSlide.id, text: slideText(activeSlide) }
  }
  return out
}

/** Read + drive the advisor thread for `deckId`, grounded in the live `slides`. Reads the memory-only
 *  `chat_message` local table off the LIVE store (never the SSR seed store, which doesn't know the table),
 *  so it's empty until the client boots and then fully reactive. `slides` is still passed to apply actions
 *  and provide the server's slide-id allowlist; model-facing deck content comes from `deckContext`. */
export function useChat(
  deckId: string,
  slides: SlideDetail[],
  edit?: ChatEditContext,
): UseChat {
  const store = useStore()
  // Applied chat actions route through the AUTHORITATIVE store (unlike the chat thread, which is local-only)
  // — grab the live mutators + undo history the dispatcher needs.
  const mutate = useMutate()
  const history = useHistory()
  const deck = edit?.deck ?? null
  const activeSlide = edit?.activeSlide ?? null
  const deckContext = edit?.deckContext ?? null
  const [undoTip, setUndoTip] = useState<{ label: string } | null>(null)

  // One live materialized view per (store, deckId); torn down when either changes or on unmount.
  const view = useMemo(() => {
    if (!store) return null
    return store.query.chat_message.where
      .deck_id(deckId)
      .orderBy('created', 'asc')
      .materialize()
  }, [store, deckId])
  useEffect(() => () => view?.destroy(), [view])

  const subscribe = useCallback(
    (onChange: () => void) =>
      view ? view.subscribe(() => onChange()) : () => {},
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
      const convo: ChatTurn[] = messages
        .filter((m) => m.status === 'done')
        .map((m) => ({ role: m.role, content: m.content }))
      const grounding = buildActGrounding(deck, activeSlide)
      const contextText = deckContext?.take() ?? ''
      // The dispatcher gets the LIVE SlideDetail[] (for applyPlan/applyGenerated/applyBodyEdit); the
      // request carries append-only deck narration plus a slide-id allowlist.
      const dctx: DispatchCtx = {
        deckId,
        slides,
        deck,
        mutate,
        history,
        activeSlideId: activeSlide?.id ?? null,
      }
      setUndoTip(null)
      track('chat:sent', { turn: convo.length })
      notifyUsageChanged() // a chat turn spends an app-paid unit → refresh the usage ring
      void sendChatAction(
        store,
        {
          deckId,
          deckContext: contextText,
          slideIds: slides.map((s) => s.id),
          history: convo,
          theme: grounding.theme,
          activeSlide: grounding.activeSlide,
        },
        text,
        (actions) => dispatchActions(actions, dctx),
      ).then((tip) => {
        if (!tip) return
        setUndoTip(tip)
        track('chat:edit', { slides: slides.length })
      })
    },
    [
      store,
      busy,
      messages,
      deckId,
      slides,
      deck,
      activeSlide,
      deckContext,
      mutate,
      history,
    ],
  )

  const undoLast = useCallback(() => {
    history.undo()
    setUndoTip(null)
  }, [history])

  const clear = useCallback(() => {
    if (!store || !view) return
    const rows = view.data
    if (rows.length === 0) return
    setUndoTip(null)
    void store.writeLocal((tx) => {
      for (const r of rows) tx.remove('chat_message', r)
    })
  }, [store, view])

  return { messages, send, busy, clear, undoTip, undoLast }
}
