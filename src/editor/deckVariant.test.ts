import { describe, expect, it } from 'vitest'
import { variantSlideText } from './deckVariant'
import type { AnyComponent } from './types'

function doc(text: string): string {
  return JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  })
}

function component(id: string, text: string, z_order: number): AnyComponent {
  return {
    id,
    slide_id: 's1',
    kind: 'text',
    doc: doc(text),
    z_order,
    x: 0,
    y: 0,
    scale_x: 1,
    scale_y: 1,
    scale_w: 400,
    scale_h: 160,
    rotate: 0,
    skew_x: 0,
    skew_y: 0,
    custom_classes: '',
  }
}

describe('variant slide grounding', () => {
  it('uses every canonical text component in spatial order', () => {
    const text = variantSlideText(null, [
      component('caption', 'Positioned caption', 2),
      component('body', 'Primary story', 0),
      component('metric', 'Supporting metric', 1),
    ])

    expect(text).toBe(
      'Primary story Supporting metric Positioned caption',
    )
  })

  it('ignores non-text components and empty documents', () => {
    const image = { ...component('image', '', 1), kind: 'image' as const }
    expect(variantSlideText(null, [component('body', '', 0), image])).toBe('')
  })
})
