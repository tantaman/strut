import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MarkdownBodies, slideHasBody } from './render'

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
