import { describe, expect, it, vi } from 'vitest'
import { importDeck } from './deckIO'
import type { ImportedDeck } from './serialize'

function imported(markdown: string, doc = ''): ImportedDeck {
  return {
    title: 'Legacy deck',
    background: 'bg-default',
    surface: 'bg-default',
    heading_font: '',
    heading_color: '',
    body_font: '',
    body_color: '',
    text_align: '',
    default_slide_mode: '',
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
        markdown,
        doc,
        render_mode: '',
        text_align: '',
        body_region: '',
        layout: '',
        cells: '',
        pad: '',
        valign: '',
        components: [],
      },
    ],
  }
}

describe('deck import compatibility', () => {
  it('preserves legacy raw Markdown instead of importing a blank body', () => {
    const mutate = {
      createDeck: vi.fn(),
      setDeckTheme: vi.fn(),
      addSlide: vi.fn(),
      setSlideTransform: vi.fn(),
      setSlideMarkdown: vi.fn(),
    }

    importDeck(
      mutate as unknown as Parameters<typeof importDeck>[0],
      imported('# Still here'),
    )

    expect(mutate.setSlideMarkdown).toHaveBeenCalledOnce()
    expect(mutate.setSlideMarkdown).toHaveBeenCalledWith(
      expect.objectContaining({ markdown: '# Still here' }),
    )
  })
})
