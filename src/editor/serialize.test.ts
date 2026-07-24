import { describe, expect, it } from 'vitest'
import { deserializeDeck, serializeDeck } from './serialize'
import type { DeckBundle } from './serialize'

const DOC = JSON.stringify({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Hello' }],
    },
    { type: 'paragraph', content: [{ type: 'text', text: 'Shared body' }] },
  ],
})

function bundle(): DeckBundle {
  return {
    deck: {
      id: 'd1',
      title: 'Unified deck',
      background: 'bg-ink',
      surface: 'bg-surf-ink',
      heading_font: 'Space Grotesk',
      heading_color: 'ffffff',
      body_font: 'Lato',
      body_color: 'dddddd',
      text_align: 'center',
      chosen_presenter: 'impress',
      canned_transition: 'zoom',
      custom_stylesheet: '',
      deck_version: '1.0',
    },
    slides: [
      {
        id: 's1',
        body_component_id: 'body-1',
        x: 0,
        y: 0,
        z: 0,
        rotate_x: 0,
        rotate_y: 0,
        rotate_z: 0,
        imp_scale: 3,
        background: '',
        surface: '',
        text_align: 'right',
      },
    ],
    componentsBySlide: {
      s1: [
        {
          id: 'body-1',
          slide_id: 's1',
          kind: 'text',
          z_order: 0,
          x: 0,
          y: 0,
          scale_x: 1,
          scale_y: 1,
          scale_w: 1280,
          scale_h: 720,
          rotate: 0,
          skew_x: 0,
          skew_y: 0,
          custom_classes: '',
          doc: DOC,
        },
        {
          id: 'caption-1',
          slide_id: 's1',
          kind: 'text',
          z_order: 1,
          x: 100,
          y: 120,
          scale_x: 1,
          scale_y: 1,
          scale_w: 360,
          scale_h: 120,
          rotate: 0,
          skew_x: 0,
          skew_y: 0,
          custom_classes: '',
          doc: DOC,
        },
      ],
    },
    customBackgrounds: [],
  }
}

describe('unified component serialization', () => {
  it('round-trips the primary marker, TipTap content and freeform text', () => {
    const raw = serializeDeck(bundle())
    const rawComponents = (
      raw.slides as Array<{ components: Array<Record<string, unknown>> }>
    )[0].components

    expect(rawComponents[0]).toMatchObject({ primary: true, content: DOC })
    expect(rawComponents[1]).toMatchObject({ content: DOC })
    expect(rawComponents[1].primary).toBeUndefined()

    const restored = deserializeDeck(raw).slides[0].components
    expect(restored[0]).toMatchObject({ primary: true, doc: DOC })
    expect(restored[1]).toMatchObject({ primary: false, doc: DOC })
  })

  it('keeps deck and slide presentation styling around the component tree', () => {
    const restored = deserializeDeck(serializeDeck(bundle()))

    expect(restored.text_align).toBe('center')
    expect(restored.slides[0].text_align).toBe('right')
    expect(restored.canned_transition).toBe('zoom')
  })

  it('rejects files without a slide list', () => {
    expect(() => deserializeDeck({ fileName: 'broken' })).toThrow(
      /missing "slides"/,
    )
  })
})
