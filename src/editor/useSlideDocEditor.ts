// The write model behind body editing, detached from the chrome around it: a TipTap editor bound to one
// CELL of a slide, streaming every keystroke through a `.folded` mutation (debounced, last-value-wins)
// and committing ONE undo step per edit session on blur. The model is independent of card chrome and
// supports every body-layout cell without forking persistence logic.
//
// A slide's layout tiles the canvas into cells (types.ts). Cell 0's doc is the `doc` column, written via
// setSlideDoc — exactly as before, so a full-layout slide is unchanged. Cells 1..N live in the `cells`
// blob, written via setSlideCells after merging this one cell into the current blob (writeCellDoc), so a
// keystroke in one cell never clobbers a sibling. Either way the fold key is per (slide, cell), so N
// concurrent cell editors stream independently. The caller keys each editor by slide id (and cell) so a
// new slide remounts + reseeds `baselineRef` from that cell's doc.

import { useRef } from 'react'
import { useEditor } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import { useMutate } from '../rindle/RindleProvider'
import { useHistory } from './UndoProvider'
import { strutExtensions } from './tiptapSchema'
import { SlashCommand } from './slashCommand'
import { parseDoc } from './tiptapDoc'
import { markdownToHtml } from './markdown'
import { cellDocAt, writeCellDoc } from './types'
import type { SlideDetail } from './deckDetail'

export interface SlideEditorOpts {
  // The editor claims the active slide from whichever cell you type into. Held in a ref so a fresh inline
  // callback each render never re-registers.
  onFocus?: () => void
}

/** A TipTap editor for cell `idx` of a slide (idx 0 = the legacy single body, in the `doc` column). */
export function useSlideCellEditor(
  slide: SlideDetail,
  idx: number,
  opts?: SlideEditorOpts,
): Editor | null {
  const mutate = useMutate()
  const history = useHistory()
  const optsRef = useRef(opts)
  optsRef.current = opts
  // The live slide row — read at write time so a cell's read-modify-write of the `cells` blob preserves
  // whatever the sibling cells currently hold (the editor callbacks close over the FIRST render's slide).
  const slideRef = useRef(slide)
  slideRef.current = slide
  const liveEditorRef = useRef<Editor | null>(null)
  // This cell's doc JSON at the start of the edit session — one coarse undo step is pushed on blur (the
  // per-keystroke stream is a live-preview write, not an undo boundary).
  const baselineRef = useRef(cellDocAt(slide, idx))
  const storedDoc = cellDocAt(slide, idx)
  // Markdown-only rows predate `doc`. Seed their primary editor from the safe legacy renderer, but keep
  // the raw stored baseline: the first keystroke writes the canonical doc, while Undo restores `doc: ''`
  // and therefore reveals the original Markdown source again without a lossy eager migration.
  const initialContent =
    idx <= 0 && !storedDoc && slide.markdown.trim()
      ? markdownToHtml(slide.markdown)
      : parseDoc(storedDoc)

  // Write this cell's doc. Cell 0 → the `doc` column (unchanged path); cells 1..N → the `cells` blob,
  // merging just this cell in. `stream` folds per (slide, cell) for the live keystroke preview; the
  // plain form is the committed write undo/redo replay through.
  function writeDoc(doc: string) {
    if (idx <= 0) {
      mutate.setSlideDoc({ id: slide.id, doc, now: Date.now() })
    } else {
      const cells = writeCellDoc(slideRef.current.cells, idx, doc)
      mutate.setSlideCells({ id: slide.id, cells, now: Date.now() })
    }
  }
  function streamDoc(doc: string) {
    if (idx <= 0) {
      mutate.setSlideDoc.folded(
        { key: slide.id },
        { id: slide.id, doc, now: Date.now() },
      )
    } else {
      const cells = writeCellDoc(slideRef.current.cells, idx, doc)
      mutate.setSlideCells.folded(
        { key: `${slide.id}:${idx}` },
        { id: slide.id, cells, now: Date.now() },
      )
    }
  }

  // Commit the edit session as one undoable step. undo/redo swap this cell back/forward, always merged
  // into the CURRENT blob (writeDoc reads slideRef), so a later sibling edit survives undoing this one.
  function commit(ed: Editor) {
    const after = JSON.stringify(ed.getJSON())
    const before = baselineRef.current
    if (after === before) return
    baselineRef.current = after
    writeDoc(after)
    history.push({
      label: idx <= 0 ? 'Edit slide' : 'Edit cell',
      redo: () => writeDoc(after),
      undo: () => writeDoc(before),
    })
  }

  return useEditor({
    // Schema + the `/` menu. SlashCommand is appended HERE rather than living in `strutExtensions`
    // because it's editor-only chrome (React, `document`) and the schema array stays render-path safe
    // for SSR/export. It contributes no nodes or marks, so it can't change what a doc serializes to.
    extensions: [...strutExtensions, SlashCommand],
    content: initialContent,
    // The editable element IS the `.strut-md` surface, so it inherits the exact theme/typography the
    // renderer uses. `immediatelyRender: false` keeps it SSR-safe (no DOM at first render).
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'strut-md', spellcheck: 'false' },
    },
    onCreate: ({ editor: ed }) => {
      liveEditorRef.current = ed
    },
    onUpdate: ({ editor: ed }) => streamDoc(JSON.stringify(ed.getJSON())),
    onFocus: () => optsRef.current?.onFocus?.(),
    onBlur: ({ editor: ed }) => commit(ed),
    // Virtualized cards can leave the mounted window while focused. TipTap's destroy event is the last
    // reliable boundary before that editor disappears, so commit the already-streamed session as the
    // same one coarse undo step a normal blur would create.
    onDestroy: () => {
      const ed = liveEditorRef.current
      if (ed) commit(ed)
      liveEditorRef.current = null
    },
  })
}

/** The single-body editor (layout cell 0 / full-layout slides). Thin alias kept for the many call sites
 *  that edit the one body. */
export function useSlideDocEditor(
  slide: SlideDetail,
  opts?: SlideEditorOpts,
): Editor | null {
  return useSlideCellEditor(slide, 0, opts)
}
