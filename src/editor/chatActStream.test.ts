// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  extractResult,
  proseSoFar,
  readResponseLine,
  transformActStream,
} from '../../server/chatAct'
import { normalizeAction } from '../../shared/chatAction'
import { applyNote, parseActLine } from './aiChat'

// The Edit lane STREAMS plain prose + a fenced ```json action block (Workers AI can't stream JSON Mode):
// server/chatAct.ts reassembles the reply from its `{response}` frames, forwards the prose BEFORE the fence
// AS IT ARRIVES (proseSoFar), and finalizes by splitting reply-from-action (extractResult) into a firewalled
// `{result}` frame; the client (parseActLine) types the reply out and applies the result. These are the
// load-bearing string parsers on that path.

describe('readResponseLine — consuming the model stream', () => {
  it('extracts the response delta from a Workers-AI-shaped frame', () => {
    expect(readResponseLine('data: {"response":"Hel"}')).toBe('Hel')
  })
  it('returns null for [DONE], comments, blanks and garbled data', () => {
    expect(readResponseLine('data: [DONE]')).toBeNull()
    expect(readResponseLine(': keep-alive')).toBeNull()
    expect(readResponseLine('')).toBeNull()
    expect(readResponseLine('data: {not json')).toBeNull()
    expect(readResponseLine('data: {"other":"x"}')).toBeNull()
  })
})

describe('proseSoFar — the reply prose safe to show', () => {
  it('holds back the last 2 chars until more (or the fence) arrives', () => {
    expect(proseSoFar('Hello')).toBe('Hel')
    expect(proseSoFar('a')).toBe('')
    expect(proseSoFar('``')).toBe('') // a partial fence must not flash as prose
  })

  it('freezes the prose at the fence once it appears', () => {
    expect(proseSoFar('Warmed it up.\n```json\n{"kind":')).toBe(
      'Warmed it up.\n',
    )
  })

  it('is monotonic across growing prefixes (never rewinds)', () => {
    const full = 'Adding three slides.\n```json\n{"kind":"generate"}\n```'
    let prev = ''
    for (let n = 1; n <= full.length; n++) {
      const got = proseSoFar(full.slice(0, n))
      expect(got.startsWith(prev) || prev.startsWith(got)).toBe(true)
      if (got.length >= prev.length) prev = got
    }
    expect(prev).toBe('Adding three slides.\n')
  })
})

describe('extractResult — splitting the reply from the fenced action', () => {
  it('reads prose + a ```json block', () => {
    expect(
      extractResult(
        'Warmed it up.\n```json\n{"kind":"set_theme","background":"#1e1e24"}\n```',
      ),
    ).toEqual({
      say: 'Warmed it up.',
      action: { kind: 'set_theme', background: '#1e1e24' },
    })
  })

  it('handles a fence with no language tag', () => {
    expect(
      extractResult('Done.\n```\n{"kind":"arrange","instruction":"x"}\n```'),
    ).toEqual({ say: 'Done.', action: { kind: 'arrange', instruction: 'x' } })
  })

  it('parses a truncated (unclosed) fence body', () => {
    expect(
      extractResult('On it.\n```json\n{"kind":"arrange","instruction":"x"}'),
    ).toEqual({ say: 'On it.', action: { kind: 'arrange', instruction: 'x' } })
  })

  it('salvages a JSON object surrounded by stray text in the block', () => {
    expect(
      extractResult(
        'Ok.\n```json\nhere: {"kind":"arrange","instruction":""} done\n```',
      ),
    ).toEqual({ say: 'Ok.', action: { kind: 'arrange', instruction: '' } })
  })

  it('degrades to advice-only when the reply has no fenced block', () => {
    expect(extractResult('That flow reads well.')).toEqual({
      say: 'That flow reads well.',
      action: null,
    })
  })

  it('degrades to advice-only (action null) on a malformed block', () => {
    expect(extractResult('Sure.\n```json\n{not json}\n```')).toEqual({
      say: 'Sure.',
      action: null,
    })
  })

  it('reads a bare {say,action} object if the model ignored the prose format', () => {
    expect(
      extractResult(
        '{"say":"Hi","action":{"kind":"generate","description":"x"}}',
      ),
    ).toEqual({
      say: 'Hi',
      action: { kind: 'generate', description: 'x' },
    })
  })
})

describe('parseActLine — the client reader', () => {
  it('reads a prose delta frame', () => {
    expect(parseActLine('data: {"response":"typing"}')).toEqual({
      done: false,
      delta: 'typing',
      result: null,
    })
  })
  it('reads the terminal result frame', () => {
    expect(
      parseActLine(
        'data: {"result":{"say":"Done.","action":{"kind":"set_theme","background":"1e1e24"}}}',
      ),
    ).toEqual({
      done: false,
      delta: '',
      result: {
        say: 'Done.',
        action: { kind: 'set_theme', background: '1e1e24' },
      },
    })
  })
  it('reads [DONE] and skips noise', () => {
    expect(parseActLine('data: [DONE]')).toEqual({
      done: true,
      delta: '',
      result: null,
    })
    expect(parseActLine(': keep-alive')).toBeNull()
    expect(parseActLine('data: {bad')).toBeNull()
  })
  it('coerces a non-string say in a result frame to empty', () => {
    expect(
      parseActLine('data: {"result":{"say":42,"action":null}}'),
    ).toEqual({ done: false, delta: '', result: { say: '', action: null } })
  })
})

// ---- the end-to-end server transform: a model prose+fence stream → the client stream (prose `{response}`
// deltas that reconstruct the reply, then one firewalled `{result}` frame + `[DONE]`).
function modelStream(frames: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const f of frames) controller.enqueue(enc.encode(f))
      controller.close()
    },
  })
}

async function drain(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader()
  const dec = new TextDecoder()
  let out = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    out += dec.decode(value, { stream: true })
  }
  return out
}

describe('transformActStream — model stream → client stream', () => {
  const norm = (raw: unknown) =>
    normalizeAction(raw, { slideIds: ['s1'], fonts: ['Inter'] })

  it('reconstructs the reply from prose frames and ends with a firewalled result', async () => {
    // The action block is split across frames (and mid-fence) to exercise the line buffer.
    const out = await drain(
      transformActStream(
        modelStream([
          'data: {"response":"Warmed "}\n\n',
          'data: {"response":"it up."}\n\n',
          'data: {"response":"\\n```json\\n{\\"kind\\":\\"set_theme\\","}\n\n',
          'data: {"response":"\\"background\\":\\"#1e1e24\\"}\\n```"}\n\n',
          'data: [DONE]\n\n',
        ]),
        norm,
      ),
    )
    const lines = out.split('\n\n').filter((l) => l.startsWith('data:'))
    // The prose deltas concatenate to the reply (the fenced block is NOT forwarded as prose).
    const prose = lines
      .map((l) => parseActLine(l))
      .filter((e) => e && !e.done && !e.result)
      .map((e) => e!.delta)
      .join('')
    expect(prose).toContain('Warmed it up.')
    expect(prose).not.toContain('```')
    // The terminal result carries the normalized action.
    const resultEv = lines.map((l) => parseActLine(l)).find((e) => e?.result)
    expect(resultEv?.result).toEqual({
      say: 'Warmed it up.',
      action: { kind: 'set_theme', background: '1e1e24' },
    })
    expect(out.trimEnd().endsWith('data: [DONE]')).toBe(true)
  })

  it('emits an advice-only result (no fence → action null)', async () => {
    const out = await drain(
      transformActStream(
        modelStream([
          'data: {"response":"That structure flows well."}\n\n',
          'data: [DONE]\n\n',
        ]),
        norm,
      ),
    )
    const resultEv = out
      .split('\n\n')
      .filter((l) => l.startsWith('data:'))
      .map((l) => parseActLine(l))
      .find((e) => e?.result)
    expect(resultEv?.result).toEqual({
      say: 'That structure flows well.',
      action: null,
    })
  })
})

describe('applyNote — the apply sub-status', () => {
  it('labels each action kind', () => {
    expect(applyNote({ kind: 'set_theme' })).toMatch(/theme/i)
    expect(applyNote({ kind: 'set_body', slideId: 'a', markdown: '# x' })).toMatch(
      /slide/i,
    )
    expect(applyNote({ kind: 'arrange', instruction: '' })).toMatch(/arrang|rearrang/i)
  })
  it('includes the slide count for generate when known', () => {
    expect(applyNote({ kind: 'generate', description: 'x', count: 5 })).toBe(
      'Generating 5 slides…',
    )
    expect(applyNote({ kind: 'generate', description: 'x' })).toBe(
      'Generating slides…',
    )
  })
})
