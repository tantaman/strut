import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { cmpStyle, MarkdownBodies, slideHasBody } from './render'
import type { AnyComponent } from './types'

const EMPTY_DOC = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph' }],
})

describe('legacy Markdown body compatibility', () => {
  it('renders a markdown-only row through the shared body surface', () => {
    const slide = {
      doc: '',
      cells: '',
      layout: '',
      markdown: '# Legacy title\n\n<script>alert(1)</script>',
    }

    expect(slideHasBody(slide)).toBe(true)
    const html = renderToStaticMarkup(<MarkdownBodies slide={slide} />)
    expect(html).toContain('<h1>Legacy title</h1>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })

  it('does not resurrect legacy source after a newer doc was deliberately cleared', () => {
    const slide = {
      doc: EMPTY_DOC,
      cells: '',
      layout: '',
      markdown: '# Superseded source',
    }

    expect(slideHasBody(slide)).toBe(false)
    expect(renderToStaticMarkup(<MarkdownBodies slide={slide} />)).toBe('')
  })
})

describe('precision text boxes', () => {
  const text = {
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
    custom_classes: '',
    text: 'Intrinsic until resized',
  } satisfies AnyComponent

  it('keeps legacy text intrinsic until precision resize materializes a box', () => {
    expect(cmpStyle(text)).toMatchObject({ maxWidth: 1100 })
    expect(cmpStyle(text).width).toBeUndefined()

    expect(cmpStyle({ ...text, scale_w: 320, scale_h: 140 })).toMatchObject({
      width: 320,
      height: 140,
      overflow: 'hidden',
    })
  })
})
