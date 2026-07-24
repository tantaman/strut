// Markdown → safe HTML. Pure (no React) so render surfaces, the direct-editor migration path and the
// standalone impress export can share one converter. The Marked renderer is deliberately safe without
// a DOM: legacy markdown-only rows can therefore render during SSR without briefly injecting raw HTML
// before hydration. DOMPurify remains a client-side second line of defence.

import { Marked } from 'marked'
import DOMPurify from 'dompurify'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Keep ordinary web/relative links while rejecting executable and ambiguous schemes. Raw control
 *  characters are ignored when checking the scheme so `java\nscript:` cannot bypass the guard. */
function safeUrl(raw: string): string {
  const value = raw.trim()
  const compact = [...value]
    .filter((char) => {
      const code = char.charCodeAt(0)
      return code > 0x20 && (code < 0x7f || code > 0x9f)
    })
    .join('')
  if (!compact || compact.startsWith('\\')) return ''
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(compact)?.[1]?.toLowerCase()
  if (scheme && !['http', 'https', 'mailto', 'tel'].includes(scheme)) return ''
  return value
}

const markdown = new Marked()

// GFM (tables, autolinks, ~~strike~~), hard-wrap off (blank line = paragraph, matching authoring).
// Raw HTML is shown as source text: Strut markdown is content, never an HTML execution surface.
markdown.use({
  gfm: true,
  breaks: false,
  renderer: {
    html({ text }) {
      return escapeHtml(text)
    },
    link({ href, title, tokens }) {
      const body = this.parser.parseInline(tokens)
      const safe = safeUrl(href)
      if (!safe) return body
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
      return `<a href="${escapeHtml(safe)}"${titleAttr} rel="noopener noreferrer">${body}</a>`
    },
    image({ href, title, text }) {
      const safe = safeUrl(href)
      if (!safe) return escapeHtml(text)
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
      return `<img src="${escapeHtml(safe)}" alt="${escapeHtml(text)}"${titleAttr}>`
    },
  },
})

/** Convert a markdown source string to sanitized HTML ready for `dangerouslySetInnerHTML`. Tolerates
 *  null/undefined (legacy slide rows predate the `markdown` column). */
export function markdownToHtml(md: string | null | undefined): string {
  const raw = markdown.parse(md ?? '', { async: false })
  return typeof window === 'undefined' ? raw : DOMPurify.sanitize(raw)
}
