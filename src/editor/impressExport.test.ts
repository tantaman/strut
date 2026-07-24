import { describe, expect, it } from 'vitest'
import { toImpressHTML } from './impressExport'
import type { DeckBundle } from './serialize'
import type { AnyComponent } from './types'

function doc(text: string): string {
  return JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  })
}

function textComponent(
  id: string,
  text: string,
  patch: Partial<AnyComponent> = {},
): AnyComponent {
  return {
    id,
    slide_id: 'slide-1',
    kind: 'text',
    z_order: 1,
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
    doc: doc(text),
    ...patch,
  }
}

function bundle(
  slide: Partial<DeckBundle['slides'][number]> = {},
  components: AnyComponent[] = [],
): DeckBundle {
  return {
    deck: {
      id: 'deck-1',
      title: 'Export test',
      background: 'bg-default',
      surface: 'bg-default',
      chosen_presenter: 'impress',
      canned_transition: 'none',
      custom_stylesheet: '',
      deck_version: '1.0',
    },
    slides: [
      {
        id: 'slide-1',
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
        ...slide,
      },
    ],
    componentsBySlide: { 'slide-1': components },
    customBackgrounds: [],
  }
}

describe('standalone rich-text component export', () => {
  it('exports the primary TipTap component', () => {
    const html = toImpressHTML(
      bundle({}, [textComponent('body-1', 'Canonical component')]),
    )

    expect(html).toContain('class="cmp cmp--text is-primary"')
    expect(html).toContain('<p>Canonical component</p>')
  })

  it('exports freeform rich text with exact geometry and the no-padding component rule', () => {
    const html = toImpressHTML(
      bundle({}, [
        textComponent('free-1', 'Freeform', {
          x: 40,
          y: 55,
          scale_w: 320,
          scale_h: 140,
        }),
      ]),
    )

    expect(html).toContain('left:40px;top:55px;width:320px;height:140px;')
    expect(html).toContain('.cmp--text:not(.is-primary) .strut-md{padding:0;')
    expect(html).toContain('<p>Freeform</p>')
  })

  it('applies normalized persisted classes to standalone components', () => {
    const html = toImpressHTML(
      bundle({}, [
        textComponent('free-1', 'Styled text', {
          custom_classes: 'hero hero bad" onload=alert(1)',
        }),
      ]),
    )

    expect(html).toContain('class="cmp cmp--text hero"')
    expect(html).not.toContain('onload=')
  })

  it('escapes text authored inside the constrained TipTap document', () => {
    const html = toImpressHTML(
      bundle({}, [textComponent('body-1', '<script>alert(1)</script>')]),
    )

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>alert(1)</script>')
  })

  it('rotates precision objects around the same center origin as app renderers', () => {
    const html = toImpressHTML(
      bundle({}, [
        {
          id: 'shape-1',
          slide_id: 'slide-1',
          kind: 'shape',
          z_order: 1,
          x: 120,
          y: 80,
          scale_x: 1,
          scale_y: 1,
          scale_w: 320,
          scale_h: 140,
          rotate: Math.PI / 6,
          skew_x: 0,
          skew_y: 0,
          custom_classes: '',
          shape: 'rectangle',
          markup: '<svg></svg>',
          fill: '3498db',
        },
      ]),
    )

    expect(html).toContain(
      `transform:rotate(${Math.PI / 6}rad) skewX(0rad) skewY(0rad);transform-origin:center center;`,
    )
    expect(html).not.toContain('transform-origin:top left;')
  })

  it('matches app sizing for cropped images and resized SVG shapes', () => {
    const html = toImpressHTML(
      bundle({}, [
        {
          id: 'image-1',
          slide_id: 'slide-1',
          kind: 'image',
          z_order: 1,
          x: 0,
          y: 0,
          scale_x: 1,
          scale_y: 1,
          scale_w: 400,
          scale_h: 200,
          rotate: 0,
          skew_x: 0,
          skew_y: 0,
          custom_classes: '',
          src: 'https://example.com/photo.jpg',
          image_type: '',
        },
        {
          id: 'shape-1',
          slide_id: 'slide-1',
          kind: 'shape',
          z_order: 2,
          x: 0,
          y: 0,
          scale_x: 1,
          scale_y: 1,
          scale_w: 400,
          scale_h: 200,
          rotate: 0,
          skew_x: 0,
          skew_y: 0,
          custom_classes: '',
          shape: 'rectangle',
          markup:
            '<svg viewBox="0 0 10 10"><rect width="10" height="10"/></svg>',
          fill: '3498db',
        },
      ]),
    )

    expect(html).toContain('object-fit:cover')
    expect(html).not.toContain('object-fit:contain')
    expect(html).toContain(
      '.cmp--image img,.cmp--shape svg{display:block;width:100%;height:100%;}',
    )
  })
})
