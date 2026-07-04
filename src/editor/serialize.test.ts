import { describe, expect, it } from 'vitest'
import { deserializeDeck, serializeDeck } from './serialize'
import type { DeckBundle } from './serialize'

function bundle(overrides?: Partial<DeckBundle>): DeckBundle {
  const base: DeckBundle = {
    deck: {
      id: 'd1',
      title: 'Markdown deck',
      background: 'bg-black',
      surface: 'bg-surf-grad-black',
      heading_font: 'Ubuntu',
      heading_color: 'ffffff',
      body_font: 'Lato',
      body_color: 'dddddd',
      text_align: 'center',
      default_slide_mode: 'markdown',
      canned_transition: 'zoom',
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
        markdown: '# Hello\n\nA **markdown** slide.',
        render_mode: 'markdown',
        text_align: 'right',
      },
      {
        id: 's2',
        x: 240,
        y: 0,
        z: 0,
        rotate_x: 0,
        rotate_y: 0,
        rotate_z: 0,
        imp_scale: 3,
        background: '',
        surface: '',
        // a plain spatial slide (no markdown fields)
      },
    ],
    componentsBySlide: {},
    customBackgrounds: [],
  }
  return { ...base, ...overrides }
}

describe('serialize round-trip with markdown + theme', () => {
  it('carries deck default_slide_mode + text_align across a round-trip', () => {
    const json = serializeDeck(bundle())
    const back = deserializeDeck(json)
    expect(back.default_slide_mode).toBe('markdown')
    expect(back.text_align).toBe('center')
  })

  it('carries a markdown slide (source, mode, alignment) across a round-trip', () => {
    const json = serializeDeck(bundle())
    const back = deserializeDeck(json)
    const s1 = back.slides[0]
    expect(s1.render_mode).toBe('markdown')
    expect(s1.markdown).toBe('# Hello\n\nA **markdown** slide.')
    expect(s1.text_align).toBe('right')
  })

  it('omits markdown fields for a spatial slide and restores them as empty', () => {
    const json = serializeDeck(bundle())
    const rawSlides = json.slides as Array<Record<string, unknown>>
    // The spatial slide should not carry markdown-mode keys in the exported JSON.
    expect(rawSlides[1].renderMode).toBeUndefined()
    expect(rawSlides[1].markdown).toBeUndefined()
    expect(rawSlides[1].textAlign).toBeUndefined()

    const back = deserializeDeck(json)
    const s2 = back.slides[1]
    expect(s2.render_mode).toBe('')
    expect(s2.markdown).toBe('')
    expect(s2.text_align).toBe('')
  })

  it('still parses a legacy file with no markdown/theme-align keys', () => {
    const legacy = {
      fileName: 'legacy',
      slides: [{ type: 'slide', x: 0, y: 0, components: [] }],
    }
    const back = deserializeDeck(legacy)
    expect(back.default_slide_mode).toBe('')
    expect(back.text_align).toBe('')
    expect(back.slides[0].render_mode).toBe('')
    expect(back.slides[0].markdown).toBe('')
  })
})
