// Client side of "🎙️ From a recording": turn a model-authored NarratedDeck (a Markdown body + speaker
// notes per slide) into new slides appended to the deck, as a SINGLE undoable step (applyNarrated). Like
// "✨ Generate slides" (aiGenerate.ts), the model is just another producer of the ordinary mutations a human
// makes — here addSlide + setSlideDoc for the body, plus setSlideNotes for the narration — so it inherits
// sync, server-side permission gating, and undo for free. The differentiator: the narration lands in the
// `slide_notes` side table, so the generated deck opens with Research mode already populated.
//
// Both the body Markdown and the notes are converted with markdownToDoc (shared with aiGenerate), the same
// markdown → sanitized HTML → ProseMirror JSON path the markdown editor and deck import use — so this is
// also the injection SINK's sanitizer (see shared/transcript.ts's normalizeNarrated, the trust boundary).

import { newId, OVERVIEW_CARD_GAP } from '../config'
import { keysBetween } from '../lib/order'
import { markdownToDoc } from './aiGenerate'
import type { History } from './history'
import type { SlideDetail } from './deckDetail'
import type { NarratedDeck } from '../../shared/transcript'
import type {
  AddSlideArgs,
  DeleteSlideArgs,
  SetSlideDocArgs,
  SetSlideNotesArgs,
} from '../../shared/app-def'

// The mutations we call, typed exactly like the shared mutators so the live `mutate` object (or its
// pre-boot deferred Proxy) is assignable — no dependency on the concrete app type. setSlideNotes is the
// extra one over aiGenerate's GenerateMutate: it writes the per-slide Research notes.
export interface NarrateMutate {
  addSlide: (a: AddSlideArgs) => unknown
  setSlideDoc: (a: SetSlideDocArgs) => unknown
  setSlideNotes: (a: SetSlideNotesArgs) => unknown
  deleteSlide: (a: DeleteSlideArgs) => unknown
}

/** Append the narrated slides to the end of the deck as ONE undoable step: each is a markdown-mode slide
 *  whose `doc` is the converted body Markdown, and — when the model gave narration — whose `slide_notes`
 *  row holds the converted notes. Returns the id of the first new slide (to make active), or null when
 *  there's nothing to add. The whole batch reverts in a single Cmd/Ctrl+Z; deleteSlide cascades the notes
 *  row, so undo cleans those up for free. Mirrors aiGenerate.applyGenerated. */
export function applyNarrated(
  narrated: NarratedDeck,
  mutate: NarrateMutate,
  ctx: { deckId: string; slides: SlideDetail[] },
  history: History,
): string | null {
  const gen = narrated.slides
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
    // Convert the narration to a notes `doc` only when there's narration — an empty segment leaves the
    // slide with no `slide_notes` row (created lazily on first edit, exactly as a human-authored slide).
    notesDoc: gs.notes.trim() ? markdownToDoc(gs.notes) : '',
  }))

  const redo = () => {
    for (const it of items) {
      mutate.addSlide(it.add)
      if (it.doc) mutate.setSlideDoc({ id: it.add.id, doc: it.doc, now })
      if (it.notesDoc)
        mutate.setSlideNotes({
          slideId: it.add.id,
          deckId,
          doc: it.notesDoc,
          now,
        })
    }
  }
  const undo = () => {
    for (const it of items)
      mutate.deleteSlide({ id: it.add.id, componentIds: [] })
  }
  redo()
  history.push({ label: 'Generate slides from recording', redo, undo })
  return items[0].add.id
}
