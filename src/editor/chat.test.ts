// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CHAT_LIMITS, clampChatRequest } from '../../shared/chat'
import { parseSseDelta, sendChat, sendChatAction } from './aiChat'
import type { ChatMessage } from './aiChat'
import type { DispatchOutcome } from './aiChatActions'
import type { ChatAction } from '../../shared/chatAction'
import type { StrutStore } from '../rindle/client'

// ---- clampChatRequest: the input half of the trust boundary (there's no output firewall — chat is prose,
// sanitized at render, see shared/chat.ts). Whatever the client sends, the server trims it before the model.
describe('clampChatRequest', () => {
  it('keeps the MOST RECENT maxMessages turns (trims the head, not the tail)', () => {
    const messages = Array.from(
      { length: CHAT_LIMITS.maxMessages + 5 },
      (_, i) => ({
        role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
        content: `m${i}`,
      }),
    )
    const out = clampChatRequest({ deckId: 'd', messages, slides: [] })
    expect(out.messages).toHaveLength(CHAT_LIMITS.maxMessages)
    // The last turn (the one being answered) always survives.
    expect(out.messages[out.messages.length - 1].content).toBe(
      `m${CHAT_LIMITS.maxMessages + 4}`,
    )
  })

  it('truncates each message + each slide field, caps slide count', () => {
    const out = clampChatRequest({
      deckId: 'd',
      messages: [
        {
          role: 'user',
          content: 'x'.repeat(CHAT_LIMITS.maxContentPerMessage + 50),
        },
      ],
      slides: Array.from({ length: CHAT_LIMITS.maxSlides + 10 }, (_, i) => ({
        id: `s${i}`,
        title: 't'.repeat(CHAT_LIMITS.maxTitle + 20),
        text: 'y'.repeat(CHAT_LIMITS.maxTextPerSlide + 20),
      })),
    })
    expect(out.messages[0].content.length).toBe(
      CHAT_LIMITS.maxContentPerMessage,
    )
    expect(out.slides).toHaveLength(CHAT_LIMITS.maxSlides)
    expect(out.slides[0].title.length).toBe(CHAT_LIMITS.maxTitle)
    expect(out.slides[0].text.length).toBe(CHAT_LIMITS.maxTextPerSlide)
  })

  it('coerces junk: bad role → user, non-string → empty, non-array → empty', () => {
    const out = clampChatRequest({
      deckId: 42,
      messages: [{ role: 'system', content: null }, 'nope', null],
      slides: 'nope',
    } as never)
    expect(out.deckId).toBe('')
    expect(out.messages).toEqual([
      { role: 'user', content: '' },
      { role: 'user', content: '' },
      { role: 'user', content: '' },
    ])
    expect(out.slides).toEqual([])
  })
})

// ---- parseSseDelta: the client's SSE line parser. Workers AI frames are `data: {"response":"…"}` passed
// through untouched by server/chat.ts; `[DONE]` terminates; keep-alives / blanks are skipped.
describe('parseSseDelta', () => {
  it('extracts the token delta from a data frame', () => {
    expect(parseSseDelta('data: {"response":"Hello"}')).toEqual({
      done: false,
      delta: 'Hello',
    })
  })
  it('recognizes the [DONE] terminator', () => {
    expect(parseSseDelta('data: [DONE]')).toEqual({ done: true, delta: '' })
  })
  it('skips blank lines, comments, and non-data fields (returns null)', () => {
    expect(parseSseDelta('')).toBeNull()
    expect(parseSseDelta(': keep-alive')).toBeNull()
    expect(parseSseDelta('event: message')).toBeNull()
  })
  it('tolerates a frame with no response field (empty delta) and garbage JSON (null)', () => {
    expect(parseSseDelta('data: {"p":"x"}')).toEqual({ done: false, delta: '' })
    expect(parseSseDelta('data: {not json')).toBeNull()
  })
})

// ---- sendChat against an in-memory store: the streaming write path (writeLocal add → fold tokens → done),
// plus the two failure finalizations (non-OK response, network error). A fake store captures local writes;
// fetch is stubbed to return an SSE stream.

interface FakeStore {
  rows: Map<string, ChatMessage>
  store: StrutStore
}

/** A minimal store that runs a `writeLocal` callback against an in-memory row map — enough for sendChat
 *  (which only ever `add`s and `edit`s the two turns of one exchange). */
function fakeStore(): FakeStore {
  const rows = new Map<string, ChatMessage>()
  const tx = {
    add: (_t: string, r: ChatMessage) => rows.set(r.id, { ...r }),
    edit: (_t: string, _old: ChatMessage, next: ChatMessage) =>
      rows.set(next.id, { ...next }),
    remove: (_t: string, r: ChatMessage) => rows.delete(r.id),
  }
  const store = {
    writeLocal: (fn: (tx: unknown) => void) => {
      fn(tx)
      return Promise.resolve()
    },
  } as unknown as StrutStore
  return { rows, store }
}

function sseStreamResponse(frames: string[]): Response {
  const enc = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const f of frames) controller.enqueue(enc.encode(f))
      controller.close()
    },
  })
  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  })
}

const assistantOf = (rows: Map<string, ChatMessage>) =>
  [...rows.values()].find((r) => r.role === 'assistant')
const userOf = (rows: Map<string, ChatMessage>) =>
  [...rows.values()].find((r) => r.role === 'user')

afterEach(() => vi.unstubAllGlobals())

describe('sendChat', () => {
  const ctx = { deckId: 'd1', slides: [], history: [] }

  it('appends the user turn and folds the token stream into a done assistant turn', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          sseStreamResponse([
            'data: {"response":"Hello"}\n\n',
            'data: {"response":", "}\n\n',
            'data: {"response":"world"}\n\n',
            'data: [DONE]\n\n',
          ]),
        ),
    )
    const { rows, store } = fakeStore()
    await sendChat(store, ctx, '  How does this flow?  ')

    expect(userOf(rows)).toMatchObject({
      role: 'user',
      content: 'How does this flow?', // trimmed
      status: 'done',
    })
    expect(assistantOf(rows)).toMatchObject({
      role: 'assistant',
      content: 'Hello, world',
      status: 'done',
    })
  })

  it('splits SSE frames that arrive across chunk boundaries', async () => {
    // The three enqueued chunks split a single logical frame mid-JSON — the reader must buffer.
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          sseStreamResponse([
            'data: {"resp',
            'onse":"chunk-split"}\n\ndata: [DONE]\n\n',
          ]),
        ),
    )
    const { rows, store } = fakeStore()
    await sendChat(store, ctx, 'hi')
    expect(assistantOf(rows)?.content).toBe('chunk-split')
    expect(assistantOf(rows)?.status).toBe('done')
  })

  it('finalizes an error turn (with the server message) on a non-OK response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ message: 'Daily AI chat limit reached.' }),
          {
            status: 429,
            headers: { 'content-type': 'application/json' },
          },
        ),
      ),
    )
    const { rows, store } = fakeStore()
    await sendChat(store, ctx, 'hi')
    expect(assistantOf(rows)).toMatchObject({
      status: 'error',
      content: 'Daily AI chat limit reached.',
    })
  })

  it('finalizes an error turn on a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const { rows, store } = fakeStore()
    await sendChat(store, ctx, 'hi')
    expect(assistantOf(rows)?.status).toBe('error')
    expect(assistantOf(rows)?.content).toMatch(/network/i)
  })

  it('is a no-op for empty text', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { rows, store } = fakeStore()
    await sendChat(store, ctx, '   ')
    expect(rows.size).toBe(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

// ---- sendChatAction: the Edit lane now STREAMS too — the reply types out of `{response}` frames, then the
// terminal `{result}` frame's action is applied (with an "Applying…" note on the row during the apply).
describe('sendChatAction', () => {
  const ctx = { deckId: 'd1', slides: [], history: [] }

  it('streams the reply into content, then dispatches the result-frame actions', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          sseStreamResponse([
            'data: {"response":"Warmed "}\n\n',
            'data: {"response":"it up."}\n\n',
            'data: {"result":{"say":"Warmed it up.","actions":[{"kind":"set_theme","background":"1e1e24"}]}}\n\n',
            'data: [DONE]\n\n',
          ]),
        ),
    )
    const { rows, store } = fakeStore()
    let dispatched: ChatAction[] | null = null
    let noteWhileApplying = ''
    const dispatch = (actions: ChatAction[]): Promise<DispatchOutcome> => {
      dispatched = actions
      noteWhileApplying = assistantOf(rows)?.note ?? '' // the row shows the sub-status during the apply
      return Promise.resolve({ ok: true, label: 'AI theme' })
    }

    const tip = await sendChatAction(store, ctx, 'make it warmer', dispatch)

    expect(dispatched).toEqual([{ kind: 'set_theme', background: '1e1e24' }])
    expect(noteWhileApplying).toBe('Applying theme…')
    expect(assistantOf(rows)).toMatchObject({
      role: 'assistant',
      content: 'Warmed it up.',
      status: 'done',
      note: '', // cleared once applied
    })
    expect(tip).toEqual({ label: 'AI theme' })
  })

  it('renders an advice-only turn (no actions) without dispatching', async () => {
    const dispatch = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          sseStreamResponse([
            'data: {"response":"That flow reads well."}\n\n',
            'data: {"result":{"say":"That flow reads well.","actions":[]}}\n\n',
            'data: [DONE]\n\n',
          ]),
        ),
    )
    const { rows, store } = fakeStore()
    const tip = await sendChatAction(store, ctx, 'does this flow?', dispatch)
    expect(dispatch).not.toHaveBeenCalled()
    expect(tip).toBeNull()
    expect(assistantOf(rows)).toMatchObject({
      content: 'That flow reads well.',
      status: 'done',
    })
  })

  it('keeps the reply but errors the turn when the apply fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          sseStreamResponse([
            'data: {"result":{"say":"On it.","actions":[{"kind":"arrange","instruction":"timeline"}]}}\n\n',
            'data: [DONE]\n\n',
          ]),
        ),
    )
    const { rows, store } = fakeStore()
    const dispatch = (): Promise<DispatchOutcome> =>
      Promise.resolve({ ok: false, error: 'The AI is unavailable right now.' })
    const tip = await sendChatAction(store, ctx, 'make a timeline', dispatch)
    expect(tip).toBeNull()
    const a = assistantOf(rows)
    expect(a?.status).toBe('error')
    expect(a?.content).toContain('On it.')
    expect(a?.content).toMatch(/unavailable/i)
    expect(a?.note).toBe('')
  })

  it('errors the turn on a non-OK response before any stream', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Sign in to edit.' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    )
    const { rows, store } = fakeStore()
    const tip = await sendChatAction(store, ctx, 'x', vi.fn())
    expect(tip).toBeNull()
    expect(assistantOf(rows)?.status).toBe('error')
  })
})
