// TipTap document ↔ HTML/JSON helpers. Pure (no React), shared by every read surface (render.tsx
// MarkdownSurface, SlideView thumbnails, the impress export) — the JSON-doc analogue of markdown.ts.
//
// `@tiptap/static-renderer` turns the stored doc JSON into an HTML string WITHOUT a DOM (unlike the
// old `generateHTML`, which needed jsdom), so this works during SSR and in the pure export path.
// DOMPurify still runs on the client as defense-in-depth, matching the trust posture markdown.ts uses
// for its `dangerouslySetInnerHTML` sink (the schema itself has no raw-HTML node, so output is already
// structurally constrained).

import { renderToHTMLString } from '@tiptap/static-renderer'
import type { JSONContent } from '@tiptap/core'
import DOMPurify from 'dompurify'
import { strutExtensions } from './tiptapSchema'

/** An empty TipTap doc (one empty paragraph) — the seed for a fresh markdown-mode slide and the
 *  fallback whenever a stored `doc` is missing or unparseable. */
export const EMPTY_DOC: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}

/** Parse a stored `doc` column (JSON string) into a TipTap document. Tolerates null/undefined (fresh
 *  slides, legacy rows that predate the `doc` column) and malformed JSON by returning an empty doc. */
export function parseDoc(raw: string | null | undefined): JSONContent {
  if (!raw) return EMPTY_DOC
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as JSONContent) : EMPTY_DOC
  } catch {
    return EMPTY_DOC
  }
}

/** True when a doc has no real content (empty or just blank paragraphs) — lets callers show a
 *  placeholder / skip work for an untouched markdown slide. */
export function isDocEmpty(raw: string | null | undefined): boolean {
  const doc = parseDoc(raw)
  const content = doc.content
  if (!content || content.length === 0) return true
  return content.every(
    (node) =>
      node.type === 'paragraph' && (!node.content || node.content.length === 0),
  )
}

/** Render a stored `doc` (JSON string) to sanitized HTML ready for `dangerouslySetInnerHTML`. Uses the
 *  shared schema so the output matches what the editor shows. SSR returns the raw string (no `window`
 *  for DOMPurify) and the client re-sanitizes on hydration — same as markdownToHtml. */
export function docToHtml(raw: string | null | undefined): string {
  let html: string
  try {
    html = renderToHTMLString({
      content: parseDoc(raw),
      extensions: strutExtensions,
    })
  } catch {
    return ''
  }
  return typeof window === 'undefined' ? html : DOMPurify.sanitize(html)
}
