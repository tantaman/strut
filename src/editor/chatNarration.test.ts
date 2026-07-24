import { describe, expect, it } from 'vitest'
import type { SemanticEvent } from '@rindle/narrator'
import { digestChatNarration } from './chatNarration'

function event(
  row: Record<string, unknown>,
  old: Record<string, unknown>,
  text: string,
  aliasChain: string[] = ['slides'],
): SemanticEvent {
  return {
    query: 'deckDetail',
    phase: 'batch',
    salience: 'info',
    text,
    resolved: {
      aliasChain,
      alias: aliasChain[aliasChain.length - 1] ?? '',
      op: 'edit',
      row,
      old,
      levelSchema: { columns: [], relationships: [] },
    } as unknown as SemanticEvent['resolved'],
  }
}

describe('digestChatNarration', () => {
  const doc = (text: string) =>
    JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    })

  const textRow = (text: string) => ({
    id: 'c1',
    slide_id: 's1',
    type: 'text',
    content: doc(text),
    props: {},
  })

  it('coalesces streamed component-content edits to the last document', () => {
    const out = digestChatNarration([
      event(textRow('a'), textRow(''), 'text=a', ['slides', 'components']),
      event(textRow('ab'), textRow('a'), 'text=ab', [
        'slides',
        'components',
      ]),
      event(textRow('abc'), textRow('ab'), 'text=abc', [
        'slides',
        'components',
      ]),
    ])

    const lines = out.split('\n')
    expect(lines).toContain(
      '[info] Component c1 on slide s1 updated: text="abc".',
    )
    expect(lines.join('\n')).not.toContain('text="a".')
    expect(lines.join('\n')).not.toContain('text="ab".')
  })

  it('does not coalesce component content with a separate slide transform', () => {
    const out = digestChatNarration([
      event(textRow('a'), textRow(''), 'text=a', ['slides', 'components']),
      event({ id: 's1', x: 10 }, { id: 's1', x: 0 }, 'x=10'),
    ])

    expect(out).toContain('text="a"')
    expect(out).toContain('x 0 -> 10')
  })

  it('coalesces high-frequency component prop edits independently', () => {
    const out = digestChatNarration([
      event(
        { id: 'c1', slide_id: 's1', props: { size: 24 } },
        { id: 'c1', slide_id: 's1', props: { size: 16 } },
        'size=24',
        ['slides', 'components'],
      ),
      event(
        { id: 'c1', slide_id: 's1', props: { size: 32 } },
        { id: 'c1', slide_id: 's1', props: { size: 24 } },
        'size=32',
        ['slides', 'components'],
      ),
    ])

    const lines = out.split('\n')
    expect(lines).toContain(
      '[info] Component c1 on slide s1 updated: props={size=32}.',
    )
    expect(lines.join('\n')).not.toContain('props={size=24}')
  })

  it('renders coalesced edits from the first old row to the latest row', () => {
    const out = digestChatNarration([
      event({ id: 's1', x: 1 }, { id: 's1', x: 0 }, 'x 0 -> 1'),
      event({ id: 's1', x: 2 }, { id: 's1', x: 1 }, 'x 1 -> 2'),
      event({ id: 's1', x: 3 }, { id: 's1', x: 2 }, 'x 2 -> 3'),
    ])

    expect(out).toContain('x 0 -> 3')
    expect(out).not.toContain('x 1 -> 2')
    expect(out).not.toContain('x 2 -> 3')
  })
})
