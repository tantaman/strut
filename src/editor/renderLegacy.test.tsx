import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { cmpStyle, renderInner } from './render'
import type { AnyComponent } from './types'

function doc(text: string): string {
  return JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  })
}

describe('rich-text component rendering', () => {
  const text = {
    id: 'text-1',
    slide_id: 'slide-1',
    kind: 'text',
    z_order: 1,
    x: 10,
    y: 20,
    scale_x: 1,
    scale_y: 1,
    scale_w: 320,
    scale_h: 140,
    rotate: 0,
    skew_x: 0,
    skew_y: 0,
    custom_classes: '',
    doc: doc('One shared document'),
  } satisfies AnyComponent

  it('renders TipTap content through the shared strut document scope', () => {
    const html = renderToStaticMarkup(<>{renderInner(text)}</>)

    expect(html).toContain('class="cmp__textbody strut-md"')
    expect(html).toContain('<p>One shared document</p>')
  })

  it('always renders exact text-box geometry', () => {
    expect(cmpStyle(text)).toMatchObject({
      left: 10,
      top: 20,
      width: 320,
      height: 140,
      overflow: 'hidden',
    })
  })

  it('uses a bounded defensive frame when a malformed row has no persisted size', () => {
    expect(cmpStyle({ ...text, scale_w: 0, scale_h: 0 })).toMatchObject({
      width: 400,
      height: 240,
      overflow: 'hidden',
    })
  })
})
