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
  it('coalesces buffered slide-body edits to the last body update', () => {
    const out = digestChatNarration([
      event({ id: 's1', doc: '', markdown: 'a' }, { id: 's1', doc: '', markdown: '' }, 'body=a'),
      event({ id: 's1', doc: '', markdown: 'ab' }, { id: 's1', doc: '', markdown: 'a' }, 'body=ab'),
      event({ id: 's1', doc: '', markdown: 'abc' }, { id: 's1', doc: '', markdown: 'ab' }, 'body=abc'),
    ])

    const lines = out.split('\n')
    expect(lines).toContain('[info] Slide s1 updated: body="abc".')
    expect(lines).not.toContain('[info] Slide s1 updated: body="a".')
    expect(lines).not.toContain('[info] Slide s1 updated: body="ab".')
  })

  it('does not coalesce a slide body edit with a separate transform edit', () => {
    const out = digestChatNarration([
      event({ id: 's1', doc: '', markdown: 'a' }, { id: 's1', doc: '', markdown: '' }, 'body=a'),
      event({ id: 's1', x: 10, doc: '', markdown: 'a' }, { id: 's1', x: 0, doc: '', markdown: 'a' }, 'x=10'),
    ])

    expect(out).toContain('body="a"')
    expect(out).toContain('x 0 -> 10')
  })

  it('coalesces high-frequency component prop edits independently', () => {
    const out = digestChatNarration([
      event(
        { id: 'c1', props: { text: 'h' } },
        { id: 'c1', props: { text: '' } },
        'text=h',
        ['slides', 'components'],
      ),
      event(
        { id: 'c1', props: { text: 'hi' } },
        { id: 'c1', props: { text: 'h' } },
        'text=hi',
        ['slides', 'components'],
      ),
    ])

    const lines = out.split('\n')
    expect(lines).toContain('[info] Component c1 on slide  updated: props={text="hi"}.')
    expect(lines).not.toContain('[info] Component c1 on slide  updated: props={text="h"}.')
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
