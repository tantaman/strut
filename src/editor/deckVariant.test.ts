import { describe, expect, it } from 'vitest'
import { variantSlideText } from './deckVariant'
import type { AnyComponent } from './types'

function doc(text: string): string {
  return JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  })
}

const emptyDoc = JSON.stringify({ type: 'doc', content: [] })

describe('variant slide grounding', () => {
  it('includes populated visible cells in reading order without legacy or dormant duplicates', () => {
    const text = variantSlideText(
      {
        doc: doc('Primary story'),
        markdown: '# Stale legacy copy',
        layout: 'grid-4',
        cells: JSON.stringify([
          '',
          doc('Supporting metric'),
          '',
          doc('Closing evidence'),
          doc('Dormant fifth cell'),
        ]),
      },
      [{ kind: 'text', text: 'Positioned caption' } as AnyComponent],
    )

    expect(text).toBe(
      'Primary story Supporting metric Closing evidence Positioned caption',
    )
    expect(text).not.toContain('Stale legacy copy')
    expect(text).not.toContain('Dormant fifth cell')
  })

  it('uses legacy markdown only when no primary doc is stored', () => {
    expect(
      variantSlideText({ doc: '', markdown: '# Legacy only', layout: '' }, []),
    ).toBe('Legacy only')

    expect(
      variantSlideText(
        { doc: emptyDoc, markdown: '# Stale legacy copy', layout: '' },
        [],
      ),
    ).toBe('')
  })
})
