// The single TipTap/ProseMirror schema for markdown-mode slides — the ONE place the node/mark set is
// declared. Both the editor (TipTapSlideEditor via `useEditor`) and the read-only renderer (tiptapDoc
// `docToHtml` via the static renderer) build from this same array, so what you edit and what a
// thumbnail/export shows can't drift. Because a slide's `doc` is now stored JSON, this list is a DATA
// CONTRACT: adding/removing a node type is effectively a schema change for already-saved slides.
//
// Deliberately React-free and DOM-free (it only pulls `@tiptap/starter-kit`), so the render path stays
// usable from the pure impress export and during SSR. The editor imports `@tiptap/react` separately.

import { StarterKit } from '@tiptap/starter-kit'
import type { Extensions } from '@tiptap/core'

// StarterKit v3 bundles doc/paragraph/text, headings, bold/italic/strike/underline/code, code block,
// blockquote, bullet+ordered lists, horizontal rule, hard break, link, plus editor-only plugins
// (undo/redo, dropcursor, trailing node) that the static renderer simply ignores. This roughly matches
// the GFM feature set the old `marked` converter produced; tables are the one gap (a later add-on).
export const strutExtensions: Extensions = [
  StarterKit.configure({
    // Links open in the app editor should NOT navigate on click (you're editing), but should still
    // render as real anchors on read-only surfaces / exports. autolink turns pasted URLs into links.
    link: {
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { rel: 'noopener nofollow', target: '_blank' },
    },
  }),
]
