// Rich-text editor for a slide's RESEARCH NOTES (the slide_notes side table). Mirrors TipTapSlideEditor's
// write model exactly — the stored note `doc` (TipTap JSON) is the source of truth, streamed via Rindle's
// `.folded` (debounced, last-value-wins) on every keystroke, with ONE coarse undo step committed on blur —
// but renders as a plain full-width document rather than the fit-to-slide slide surface. Reuses the SAME
// `strutExtensions` as slides, so a note IS a slide-shaped doc (renderable by the static renderer, and
// groundable by the AI Edit lane later). Bound by slide_id; deck_id rides along for the deck-scoped write.

import { useEffect, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { useMutate } from '../rindle/RindleProvider'
import { useHistory } from './UndoProvider'
import { strutExtensions } from './tiptapSchema'
import { parseDoc } from './tiptapDoc'

export function SlideNotesEditor({
  slideId,
  deckId,
  doc,
  canEdit,
  autoFocus = false,
}: {
  slideId: string
  deckId: string
  // The note's stored doc (JSON string) at mount. Seeds the editor ONCE — like TipTapSlideEditor, an open
  // editor is the source of truth and doesn't rebase remote edits into itself (last-writer-wins, same as
  // slide bodies). The caller mounts this only after the notes query is authoritative and keys it by
  // slideId, so the seed is correct.
  doc: string
  canEdit: boolean
  // While true, this editor claims the caret (and releases it when it turns false). Doc mode's card
  // flip drives it so turning a card over drops you straight into writing the notes — and flipping
  // back blurs, which is what commits the edit session as one undo step.
  autoFocus?: boolean
}) {
  const mutate = useMutate()
  const history = useHistory()
  // Baseline for the coarse per-session undo step (pushed on blur); reseeds on each committed edit.
  const baselineRef = useRef(doc)

  const editor = useEditor({
    extensions: strutExtensions,
    content: parseDoc(doc),
    editable: canEdit,
    // SSR-safe: no DOM at first render (this view is client-only, but keep the contract consistent).
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'notes-doc__prose', spellcheck: 'true' },
    },
    onUpdate: ({ editor: ed }) => {
      const json = JSON.stringify(ed.getJSON())
      mutate.setSlideNotes.folded(
        { key: slideId },
        { slideId, deckId, doc: json, now: Date.now() },
      )
    },
    onBlur: () => commit(),
  })

  // Follow `autoFocus` AFTER mount too (the flip toggles it on an already-mounted editor). Focusing a
  // read-only editor would put a useless caret nowhere, so only claim when editable; releasing checks
  // isFocused so an unflip never blurs an editor the user has since moved out of.
  useEffect(() => {
    if (!editor) return
    if (autoFocus && canEdit) editor.commands.focus('end')
    else if (!autoFocus && editor.isFocused) editor.commands.blur()
  }, [autoFocus, canEdit, editor])

  // Commit the edit session as one undoable step (undo/redo swap the whole note doc) — mirrors slides.
  function commit() {
    if (!editor) return
    const after = JSON.stringify(editor.getJSON())
    const before = baselineRef.current
    if (after === before) return
    baselineRef.current = after
    const apply = (d: string) =>
      mutate.setSlideNotes({ slideId, deckId, doc: d, now: Date.now() })
    apply(after)
    history.push({
      label: 'Edit research notes',
      redo: () => apply(after),
      undo: () => apply(before),
    })
  }

  // `editor.isEmpty` updates per-transaction (no store round-trip), so the placeholder hides the instant
  // you type — no flicker. Shown as an inert overlay on the empty first line.
  const showPlaceholder = !!editor?.isEmpty
  return (
    <div className="notes-doc">
      {showPlaceholder && (
        <div className="notes-doc__ph" aria-hidden="true">
          {canEdit ? 'Research notes, sources, evidence…' : 'No research notes.'}
        </div>
      )}
      <EditorContent editor={editor} className="notes-doc__host" />
    </div>
  )
}
