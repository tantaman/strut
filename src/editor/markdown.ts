// Markdown → sanitized HTML. Pure (no React) so both the render surfaces (render.tsx MarkdownSurface)
// and the standalone impress export (impressExport.ts) can share one converter.
//
// `marked` turns markdown into HTML; DOMPurify strips anything dangerous before it reaches a
// `dangerouslySetInnerHTML` sink. DOMPurify needs a DOM, so during SSR (no `window`) we return the
// parsed HTML unsanitized and let the client re-sanitize on hydration — the same trust posture the
// app already takes for its other dangerouslySetInnerHTML sinks (rich text, shape SVG in render.tsx).

import { marked } from 'marked'
import DOMPurify from 'dompurify'

// GFM (tables, autolinks, ~~strike~~), hard-wrap off (blank line = paragraph, matching authoring).
marked.use({ gfm: true, breaks: false })

/** Convert a markdown source string to sanitized HTML ready for `dangerouslySetInnerHTML`. Tolerates
 *  null/undefined (legacy slide rows predate the `markdown` column). */
export function markdownToHtml(md: string | null | undefined): string {
  const raw = marked.parse(md ?? '', { async: false })
  return typeof window === 'undefined' ? raw : DOMPurify.sanitize(raw)
}
