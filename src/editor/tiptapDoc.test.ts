// @vitest-environment jsdom
// jsdom gives DOMPurify a window so docToHtml exercises the real sanitize path (mirrors markdown.test).
import { describe, expect, it } from 'vitest'
import { docToHtml, EMPTY_DOC, isDocEmpty, parseDoc } from './tiptapDoc'

const doc = (content: unknown[]) => JSON.stringify({ type: 'doc', content })

describe('docToHtml', () => {
  it('renders headings, marks, and lists from a TipTap doc', () => {
    const html = docToHtml(
      doc([
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Title' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'a ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'bold' },
            { type: 'text', text: ' word' },
          ],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
              ],
            },
          ],
        },
      ]),
    )
    expect(html.toLowerCase()).toContain('<h1')
    expect(html).toContain('Title')
    expect(html).toContain('<strong>bold</strong>')
    expect(html.toLowerCase()).toContain('<ul')
    expect(html).toContain('one')
  })

  it('is safe/empty on null, empty, and malformed input', () => {
    expect(docToHtml(null)).not.toContain('undefined')
    expect(() => docToHtml('not valid json')).not.toThrow()
    expect(parseDoc('not valid json')).toEqual(EMPTY_DOC)
    expect(isDocEmpty(null)).toBe(true)
    expect(isDocEmpty(JSON.stringify(EMPTY_DOC))).toBe(true)
    expect(
      isDocEmpty(
        doc([{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }]),
      ),
    ).toBe(false)
  })
})
