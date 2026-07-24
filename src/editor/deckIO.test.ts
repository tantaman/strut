import { describe, expect, it, vi } from 'vitest'
import { importDeck } from './deckIO'
import type { ImportedComponent, ImportedDeck } from './serialize'

const DOC = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Body' }] }],
})

function imported(components: ImportedComponent[]): ImportedDeck {
  return {
    title: 'Unified deck',
    background: 'bg-default',
    surface: 'bg-default',
    heading_font: '',
    heading_color: '',
    body_font: '',
    body_color: '',
    text_align: '',
    canned_transition: 'none',
    custom_stylesheet: '',
    deck_version: '1.0',
    customBackgrounds: [],
    slides: [
      {
        x: 0,
        y: 0,
        z: 0,
        rotate_x: 0,
        rotate_y: 0,
        rotate_z: 0,
        imp_scale: 3,
        background: '',
        surface: '',
        text_align: '',
        components,
      },
    ],
  }
}

function text(primary: boolean): ImportedComponent {
  return {
    kind: 'text',
    primary,
    x: primary ? 0 : 120,
    y: primary ? 0 : 140,
    z_order: primary ? 0 : 1,
    scale_x: 1,
    scale_y: 1,
    scale_w: primary ? 1280 : 360,
    scale_h: primary ? 720 : 120,
    rotate: 0,
    skew_x: 0,
    skew_y: 0,
    custom_classes: '',
    doc: DOC,
  }
}

describe('unified component deck import', () => {
  it('hydrates the deterministic primary row and inserts freeform text separately', () => {
    const source = imported([text(true), text(false)])
    const mutate = {
      createDeck: vi.fn(),
      setDeckTheme: vi.fn(),
      addSlide: vi.fn(),
      setSlideTransform: vi.fn(),
      setText: vi.fn(),
      moveComponent: vi.fn(),
      transformComponent: vi.fn(),
      setComponentZ: vi.fn(),
      setComponentClasses: vi.fn(),
      addText: vi.fn(),
    }

    importDeck(mutate as unknown as Parameters<typeof importDeck>[0], source)

    const slideId = mutate.addSlide.mock.calls[0][0].id
    expect(mutate.addSlide).toHaveBeenCalledWith(
      expect.objectContaining({ content: DOC }),
    )
    expect(mutate.setText).toHaveBeenCalledWith(
      expect.objectContaining({ id: `${slideId}:body` }),
    )
    expect(mutate.addText).toHaveBeenCalledOnce()
    expect(mutate.addText).toHaveBeenCalledWith(
      expect.objectContaining({ slideId, content: DOC }),
    )
  })
})
