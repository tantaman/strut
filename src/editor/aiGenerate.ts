// Client side of "✨ Generate slides": turn a model-authored GeneratedDeck (Markdown per slide) into new
// slides appended to the deck, as a SINGLE undoable step (applyGenerated). Like AI Arrange, the model is
// just another producer of the ordinary mutations a human action makes — here `addSlide` + `setSlideDoc`
// (the same pair the markdown-mode editor and deck import use) — so this inherits sync, server-side
// permission gating, and undo for free.
//
// The one piece of real work is markdownToDoc: markdown-mode slides render from the TipTap `doc` (JSON),
// NOT the raw `markdown` column (see render.tsx MarkdownSurface / tiptapDoc.ts), so we convert the
// model's Markdown → sanitized HTML (shared marked converter) → ProseMirror JSON via the shared schema.

import { generateJSON } from '@tiptap/core'
import { newId, OVERVIEW_CARD_GAP } from '../config'
import { keysBetween } from '../lib/order'
import { markdownToHtml } from './markdown'
import { EMPTY_DOC } from './tiptapDoc'
import { strutExtensions } from './tiptapSchema'
import type { History } from './history'
import type { SlideDetail } from './deckDetail'
import type { GeneratedDeck } from '../../shared/generate'
import type {
  AddSlideArgs,
  DeleteSlideArgs,
  SetSlideDocArgs,
} from '../../shared/app-def'

// The mutations we call, typed exactly like the shared mutators so the live `mutate` object (or its
// pre-boot deferred Proxy) is assignable — no dependency on the concrete app type.
export interface GenerateMutate {
  addSlide: (a: AddSlideArgs) => unknown
  setSlideDoc: (a: SetSlideDocArgs) => unknown
  deleteSlide: (a: DeleteSlideArgs) => unknown
}

/** Convert a Markdown source string to a stored `doc` (TipTap JSON string) for a markdown-mode slide.
 *  markdown → sanitized HTML (marked, shared with the render surface) → ProseMirror JSON via the shared
 *  schema. Client-only: generateJSON needs a DOM, so callers invoke this in event handlers, never at SSR.
 *  Falls back to an empty doc if the HTML can't be parsed. */
export function markdownToDoc(md: string): string {
  const html = markdownToHtml(md)
  try {
    return JSON.stringify(generateJSON(html, strutExtensions))
  } catch {
    return JSON.stringify(EMPTY_DOC)
  }
}

/** Append the generated slides to the end of the deck as ONE undoable step, each a markdown-mode slide
 *  whose `doc` is the converted Markdown. Returns the id of the first new slide (to make active), or null
 *  when there's nothing to add. Mirrors useAddSlide — the whole batch reverts in a single
 *  Cmd/Ctrl+Z, and it flows through the authoritative slide mutations (sync + permissions for free). */
export function applyGenerated(
  generated: GeneratedDeck,
  mutate: GenerateMutate,
  ctx: { deckId: string; slides: SlideDetail[] },
  history: History,
): string | null {
  const gen = generated.slides
  if (gen.length === 0) return null
  const { deckId, slides } = ctx
  const now = Date.now()

  // Sort keys: a run of evenly-spaced fractional keys strictly after the current last slide (append).
  const last = slides.length ? slides[slides.length - 1] : undefined
  const keys = keysBetween(last?.sort ?? null, null, gen.length)
  // Overview position: lay the new cards out in a row one gap past the last slide, so they don't stack.
  const baseX = last?.x ?? 0
  const baseY = last?.y ?? 0

  const items = gen.map((gs, i) => ({
    add: {
      id: newId(),
      deckId,
      sort: keys[i],
      x: baseX + OVERVIEW_CARD_GAP * (i + 1),
      y: baseY,
      // Generated content IS Markdown, so the new slides are markdown-mode regardless of the deck default.
      render_mode: 'markdown' as const,
      now,
    } satisfies AddSlideArgs,
    doc: markdownToDoc(gs.markdown),
  }))

  const redo = () => {
    for (const it of items) {
      mutate.addSlide(it.add)
      if (it.doc) mutate.setSlideDoc({ id: it.add.id, doc: it.doc, now })
    }
  }
  const undo = () => {
    for (const it of items)
      mutate.deleteSlide({ id: it.add.id, componentIds: [] })
  }
  redo()
  history.push({ label: 'Generate slides', redo, undo })
  return items[0].add.id
}
