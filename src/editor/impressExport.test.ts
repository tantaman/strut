import { describe, expect, it } from 'vitest'
import { toImpressHTML } from './impressExport'
import type { DeckBundle } from './serialize'
import { cellPad, layoutCells } from './types'
import type { AnyComponent } from './types'

function doc(text: string): string {
  return JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  })
}

function bundle(
  slide: Partial<DeckBundle['slides'][number]>,
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
        x: 0,
        y: 0,
        z: 0,
        rotate_x: 0,
        rotate_y: 0,
        rotate_z: 0,
        imp_scale: 3,
        background: '',
        surface: '',
        doc: doc('Primary cell'),
        render_mode: 'markdown',
        ...slide,
      },
    ],
    componentsBySlide: { 'slide-1': components },
    customBackgrounds: [],
  }
}

describe('standalone body export', () => {
  it('renders every populated layout cell with the app geometry and density', () => {
    const html = toImpressHTML(
      bundle({
        layout: 'grid-4',
        pad: 'compact',
        cells: JSON.stringify([
          doc('Stale cell zero'),
          doc('Second cell'),
          '',
          doc('Fourth cell'),
        ]),
      }),
    )

    expect(html.match(/class="strut-md-cell"/g)).toHaveLength(3)
    expect(html).toContain('Primary cell')
    expect(html).toContain('Second cell')
    expect(html).toContain('Fourth cell')
    expect(html).not.toContain('Stale cell zero')
    expect(html.indexOf('Primary cell')).toBeLessThan(
      html.indexOf('Second cell'),
    )
    expect(html.indexOf('Second cell')).toBeLessThan(
      html.indexOf('Fourth cell'),
    )

    const second = layoutCells('grid-4')[1]
    const { padX, padY, scale } = cellPad(second, 0.5)
    expect(html).toContain(
      `left:${second.x}px;top:${second.y}px;width:${second.w}px;height:${second.h}px;` +
        `--strut-body-pad:${padY}px ${padX}px;--strut-type-scale:${scale};` +
        '--strut-body-display:flex;',
    )
    expect(html).toContain('.strut-md-cell{position:absolute;overflow:hidden;}')
  })

  it('keeps legacy full-layout slides on the original single-body path', () => {
    const html = toImpressHTML(
      bundle({
        layout: '',
        cells: JSON.stringify(['', doc('Hidden inactive cell')]),
      }),
    )

    expect(html.match(/class="strut-md-cell"/g)).toBeNull()
    expect(html.match(/class="strut-md"/g)).toHaveLength(1)
    expect(html).toContain('Primary cell')
    expect(html).not.toContain('Hidden inactive cell')
  })

  it('renders safe raw Markdown when a legacy slide has no stored doc', () => {
    const html = toImpressHTML(
      bundle({
        doc: '',
        markdown: '# Legacy title\n\n<script>alert(1)</script>',
      }),
    )

    expect(html).toContain('<h1>Legacy title</h1>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>alert(1)</script>')
  })

  it('treats an intentionally empty stored doc as newer than legacy Markdown', () => {
    const html = toImpressHTML(
      bundle({
        doc: JSON.stringify({
          type: 'doc',
          content: [{ type: 'paragraph' }],
        }),
        markdown: '# Superseded source',
      }),
    )

    expect(html).not.toContain('Superseded source')
  })

  it('applies normalized persisted classes to standalone components', () => {
    const html = toImpressHTML(
      bundle({}, [
        {
          id: 'text-1',
          slide_id: 'slide-1',
          kind: 'text',
          z_order: 1,
          x: 10,
          y: 20,
          scale_x: 1,
          scale_y: 1,
          scale_w: 0,
          scale_h: 0,
          rotate: 0,
          skew_x: 0,
          skew_y: 0,
          custom_classes: 'hero hero bad" onload=alert(1)',
          text: 'Styled text',
        },
      ]),
    )

    expect(html).toContain('class="cmp cmp--text hero"')
    expect(html).not.toContain('onload=')
  })

  it('exports materialized precision text boxes without changing legacy intrinsic text', () => {
    const component = {
      id: 'text-1',
      slide_id: 'slide-1',
      kind: 'text' as const,
      z_order: 1,
      x: 10,
      y: 20,
      scale_x: 1,
      scale_y: 1,
      scale_w: 0,
      scale_h: 0,
      rotate: 0,
      skew_x: 0,
      skew_y: 0,
      custom_classes: '',
      text: 'Precision text',
    }

    expect(toImpressHTML(bundle({}, [component]))).toContain(
      'max-width:1100px;',
    )
    expect(
      toImpressHTML(bundle({}, [{ ...component, scale_w: 320, scale_h: 140 }])),
    ).toContain('width:320px;height:140px;overflow:hidden;')
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
})
