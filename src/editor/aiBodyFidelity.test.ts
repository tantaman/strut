import { describe, expect, it } from 'vitest'
import type { SemanticEvent } from '@rindle/narrator'
import { systemPrompt } from '../../server/chatAct'
import type { SetSlideDocArgs } from '../../shared/app-def'
import { buildDigest, slideGroundingText, slideText } from './aiArrange'
import { applyBodyEdit } from './aiBody'
import { digestChatNarration } from './chatNarration'
import type { SlideDetail } from './deckDetail'
import { History } from './history'

function doc(text: string): string {
  return JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  })
}

function tiledSlide(): SlideDetail {
  return {
    id: 's1',
    doc: doc('Primary story'),
    layout: 'grid-4',
    cells: JSON.stringify([
      '',
      doc('Supporting metric'),
      '',
      doc('Closing evidence'),
      doc('Dormant fifth cell'),
    ]),
    pad: 'compact',
    valign: 'bottom',
  } as unknown as SlideDetail
}

function editEvent(
  row: Record<string, unknown>,
  old: Record<string, unknown>,
): SemanticEvent {
  return {
    query: 'deckDetail',
    phase: 'batch',
    salience: 'info',
    text: 'body changed',
    resolved: {
      aliasChain: ['slides'],
      alias: 'slides',
      op: 'edit',
      row,
      old,
      levelSchema: { columns: [], relationships: [] },
    } as unknown as SemanticEvent['resolved'],
  }
}

describe('multi-cell AI grounding', () => {
  it('includes every populated visible cell in reading order', () => {
    const slide = tiledSlide()

    expect(slideText(slide)).toBe(
      'Primary story Supporting metric Closing evidence',
    )
    expect(slideGroundingText(slide)).toBe(
      'Cell 1: Primary story\n' +
        'Cell 2: Supporting metric\n' +
        'Cell 4: Closing evidence',
    )
    expect(slideGroundingText(slide)).not.toContain('Dormant fifth cell')
    expect(buildDigest([slide])[0].text).toContain('Supporting metric')
  })

  it('narrates sibling-cell edits into chat context', () => {
    const before = tiledSlide()
    const after = {
      ...before,
      cells: JSON.stringify(['', doc('Updated metric'), '', doc('Evidence')]),
    }

    const narration = digestChatNarration([editEvent(after, before)])

    expect(narration).toContain('Cell 1: Primary story')
    expect(narration).toContain('Cell 2: Updated metric')
    expect(narration).toContain('Cell 4: Evidence')
  })

  it('narrates newly visible stored cells when the layout expands', () => {
    const before = { ...tiledSlide(), layout: 'cols-2' }
    const after = { ...before, layout: 'grid-4' }

    const narration = digestChatNarration([editEvent(after, before)])

    expect(narration).toContain('layout "cols-2" -> "grid-4"')
    expect(narration).toContain('Cell 4: Closing evidence')
  })

  it('tells the model that set_body changes only Cell 1', () => {
    const prompt = systemPrompt(['Inter'])
    expect(prompt).toContain('PRIMARY body (Cell 1)')
    expect(prompt).toContain(
      'Existing sibling cells, layout, padding, and alignment are preserved.',
    )
  })
})

describe('multi-cell set_body fidelity', () => {
  it('rewrites only cell 0 and restores it as one undo', () => {
    const slide = tiledSlide()
    const original = {
      cells: slide.cells,
      layout: slide.layout,
      pad: slide.pad,
      valign: slide.valign,
    }
    const calls: SetSlideDocArgs[] = []
    const history = new History()

    expect(
      applyBodyEdit('s1', '# Revised primary', {
        mutate: { setSlideDoc: (args) => calls.push(args) },
        history,
        slides: [slide],
      }),
    ).toBe(true)

    expect(calls).toHaveLength(1)
    expect(calls[0].id).toBe('s1')
    expect(calls[0].doc).not.toBe(slide.doc)
    expect(calls[0]).not.toHaveProperty('cells')
    expect(calls[0]).not.toHaveProperty('layout')
    expect(calls[0]).not.toHaveProperty('pad')
    expect(calls[0]).not.toHaveProperty('valign')
    expect(slide).toMatchObject(original)
    expect(history.undoLabel).toBe('AI edit')

    history.undo()

    expect(calls).toHaveLength(2)
    expect(calls[1]).toMatchObject({ id: 's1', doc: slide.doc })
    expect(slide).toMatchObject(original)
    expect(history.canUndo).toBe(false)
  })
})
