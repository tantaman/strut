// The single TipTap/ProseMirror schema for markdown-mode slides — the ONE place the node/mark set is
// declared. Both the editor (TipTapSlideEditor via `useEditor`) and the read-only renderer (tiptapDoc
// `docToHtml` via the static renderer) build from this same array, so what you edit and what a
// thumbnail/export shows can't drift. Because a slide's `doc` is now stored JSON, this list is a DATA
// CONTRACT: adding/removing a node type is effectively a schema change for already-saved slides.
//
// Deliberately React-free and DOM-free (it only pulls `@tiptap/starter-kit`), so the render path stays
// usable from the pure impress export and during SSR. The editor imports `@tiptap/react` separately.

import { StarterKit } from '@tiptap/starter-kit'
import { Color, FontFamily, TextStyle } from '@tiptap/extension-text-style'
import { TextAlign } from '@tiptap/extension-text-align'
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
  // Per-selection inline formatting so markdown slides author like a document rather than carrying one
  // slide-wide setting. TextStyle is the base `<span style>` mark that Color + FontFamily hang their
  // attributes on; TextAlign writes a per-block `text-align` (only for the block types listed, and only
  // when set — an unaligned block emits no inline style, so it still inherits the deck's
  // `--strut-text-align` default). All four are pure schema/command defs (no DOM, no React), so the
  // static renderer emits their inline styles on thumbnails/exports exactly as the editor shows them.
  TextStyle,
  Color,
  FontFamily,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
]
