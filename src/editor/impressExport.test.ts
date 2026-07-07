import { describe, expect, it } from 'vitest'
import { toImpressHTML } from './impressExport'
import type { DeckBundle } from './serialize'
import type { AnyComponent } from './types'

const DOC = JSON.stringify({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Hi' }],
    },
    { type: 'paragraph', content: [{ type: 'text', text: 'Body.' }] },
  ],
})

function textComponent(color: string): AnyComponent {
  return {
    id: 'c1',
    kind: 'text',
    slide_id: 's1',
    x: 10,
    y: 20,
    z_order: 1,
    rotate: 0,
    skew_x: 0,
    skew_y: 0,
    scale_w: 0,
    scale_h: 0,
    size: 80,
    color,
    font_family: '',
    text: 'Shimmer',
  } as unknown as AnyComponent
}

function bundle(overrides?: Partial<DeckBundle>): DeckBundle {
  const base: DeckBundle = {
    deck: {
      id: 'd1',
      title: 'Deck',
      background: 'bg-black',
      surface: 'bg-surf-grad-black',
      heading_font: 'Lato',
      heading_color: '',
      body_font: 'Lato',
      body_color: '',
      text_align: 'left',
      default_slide_mode: 'markdown',
      canned_transition: 'none',
      custom_stylesheet: '',
      deck_version: '1.0',
    },
    slides: [
      {
        id: 's1',
        x: 0,
        y: 0,
        z: 0,
        rotate_x: 0,
        rotate_y: 0,
        rotate_z: 0,
        imp_scale: 3,
        background: '',
        surface: '',
        doc: DOC,
        render_mode: 'markdown',
        text_align: 'left',
      },
    ],
    componentsBySlide: {},
    customBackgrounds: [],
  }
  return { ...base, ...overrides }
}

describe('impress export: paint', () => {
  it('always ships the effect keyframes + reduced-motion guard', () => {
    const html = toImpressHTML(bundle())
    expect(html).toContain('@keyframes strut-shimmer')
    expect(html).toContain('@keyframes strut-holo')
    expect(html).toContain('prefers-reduced-motion')
  })

  it('emits a gradient slide background inline', () => {
    const b = bundle()
    b.deck.background = 'grad:linear/135/6741d9,3b5bdb'
    const html = toImpressHTML(b)
    expect(html).toContain('linear-gradient(135deg, #6741d9, #3b5bdb)')
  })

  it('drives an effect background with its animation', () => {
    const b = bundle()
    b.deck.background = 'fx:shimmer/c0a062,fff4d6'
    const html = toImpressHTML(b)
    expect(html).toContain('animation:strut-shimmer')
  })

  it('clips a shimmer text component to its glyphs', () => {
    const b = bundle({
      componentsBySlide: { s1: [textComponent('fx:shimmer/6741d9,c3b4ff')] },
    })
    const html = toImpressHTML(b)
    expect(html).toContain('background-clip:text')
    expect(html).toContain('animation:strut-shimmer')
    expect(html).toContain('color:transparent')
  })

  it('exposes a deck-wide gradient heading through the var contract', () => {
    const b = bundle()
    b.deck.heading_color = 'grad:linear/90/ff0000,0000ff'
    const html = toImpressHTML(b)
    expect(html).toContain(
      '--strut-heading-paint:linear-gradient(90deg, #ff0000, #0000ff)',
    )
    expect(html).toContain('--strut-heading-clip:text')
    expect(html).toContain('--strut-heading-fill:transparent')
  })

  it('emits a minted custom-background rule verbatim (no double-wrap)', () => {
    const b = bundle({
      customBackgrounds: [
        {
          klass: 'bg-custom-abc123',
          style: '.bg-custom-abc123{background:#abc123}',
        },
      ],
    })
    const html = toImpressHTML(b)
    expect(html).toContain('.bg-custom-abc123{background:#abc123}')
    // the old bug wrapped it again into `.klass{background:.klass{…}}`
    expect(html).not.toContain('{background:.bg-custom-abc123{')
  })
})
