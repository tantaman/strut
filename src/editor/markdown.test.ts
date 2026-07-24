// @vitest-environment jsdom
// jsdom gives DOMPurify a window so markdownToHtml exercises the real sanitize path.
import { describe, expect, it } from 'vitest'
import { markdownToHtml } from './markdown'

describe('markdownToHtml', () => {
  it('renders basic markdown to HTML', () => {
    expect(markdownToHtml('# Title')).toContain('<h1>Title</h1>')
    expect(markdownToHtml('a **bold** word')).toContain('<strong>bold</strong>')
    expect(markdownToHtml('- one\n- two')).toContain('<li>one</li>')
  })

  it('strips dangerous script/event markup', () => {
    const out = markdownToHtml('hi\n\n<script>alert(1)</script>')
    expect(out).not.toContain('<script>')
    expect(out).toContain('&lt;script&gt;')
    expect(out).toContain('hi')
  })

  it('strips javascript: links', () => {
    const out = markdownToHtml('[click](javascript:alert(1))')
    expect(out).not.toContain('javascript:')
  })

  it('renders raw HTML with event handlers as inert source text', () => {
    const out = markdownToHtml('<img src=x onerror="alert(1)">')
    expect(out).not.toContain('<img')
    expect(out).toContain('&lt;img')
  })

  it('rejects executable link and image schemes before DOM sanitization', () => {
    const out = markdownToHtml(
      '[click](javascript:alert(1)) ![bad](data:text/html,boom)',
    )
    expect(out).not.toContain('javascript:')
    expect(out).not.toContain('data:text/html')
    expect(out).not.toContain('href=')
    expect(out).not.toContain('src=')
  })

  it('is safe on empty input', () => {
    expect(markdownToHtml('')).toBe('')
  })
})
