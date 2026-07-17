// The write model behind body editing, detached from the chrome around it: a TipTap editor bound to one
// slide's `doc`, streaming every keystroke through `setSlideDoc.folded` (debounced, last-value-wins) and
// committing ONE undo step per edit session on blur. Extracted from TipTapSlideEditor so the same model
// can back BOTH surfaces — the Stage's single fit-to-viewport editor and Doc mode's column of N cards —
// without either owning the other's layout.
//
// Folding is keyed by slide id, so N concurrent editors stream independently and never clobber each
// other. The caller keys the component by slide id (like Stage does) so a new slide remounts the editor
// and reseeds `baselineRef` from its doc.

import { useRef } from 'react'
import { useEditor } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import { useMutate } from '../rindle/RindleProvider'
import { useHistory } from './UndoProvider'
import { strutExtensions } from './tiptapSchema'
import { parseDoc } from './tiptapDoc'
import type { SlideDetail } from './deckDetail'

export function useSlideDocEditor(
  slide: SlideDetail,
  // Doc mode hoists ONE shared format bar out of the cards and binds it to whichever editor has focus;
  // these let it track that. Held in a ref so a fresh inline callback each render never re-registers.
  opts?: {
    onFocus?: (ed: Editor) => void
    onBlur?: (ed: Editor) => void
  },
): Editor | null {
  const mutate = useMutate()
  const history = useHistory()
  const optsRef = useRef(opts)
  optsRef.current = opts
  // The doc JSON at the start of this edit session — one coarse undo step is pushed on blur (the
  // per-keystroke stream is a live-preview write, not an undo boundary).
  const baselineRef = useRef(slide.doc)

  // Commit the edit session as one undoable step (undo/redo swap the whole doc).
  function commit(ed: Editor) {
    const after = JSON.stringify(ed.getJSON())
    const before = baselineRef.current
    if (after === before) return
    baselineRef.current = after
    const apply = (doc: string) =>
      mutate.setSlideDoc({ id: slide.id, doc, now: Date.now() })
    apply(after)
    history.push({
      label: 'Edit slide',
      redo: () => apply(after),
      undo: () => apply(before),
    })
  }

  return useEditor({
    extensions: strutExtensions,
    content: parseDoc(slide.doc),
    // The editable element IS the `.strut-md` surface, so it inherits the exact theme/typography the
    // renderer uses. `immediatelyRender: false` keeps it SSR-safe (no DOM at first render).
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'strut-md', spellcheck: 'false' },
    },
    onUpdate: ({ editor: ed }) => {
      const json = JSON.stringify(ed.getJSON())
      mutate.setSlideDoc.folded(
        { key: slide.id },
        { id: slide.id, doc: json, now: Date.now() },
      )
    },
    onFocus: ({ editor: ed }) => optsRef.current?.onFocus?.(ed),
    onBlur: ({ editor: ed }) => {
      commit(ed)
      optsRef.current?.onBlur?.(ed)
    },
  })
}
