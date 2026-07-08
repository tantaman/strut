// The Research surface — a deck mode alongside Slides / Overview / Present. Backstage notes + backing
// evidence, ONE free-form doc per slide. Deliberately a single scrolling column of per-slide blocks —
// [slide thumbnail | notes editor] in `sort` order — so this one surface is BOTH the per-slide editor and
// the deck-wide transcluded read. Notes live in the slide_notes side table and sync through their OWN
// query (deckNotes), so they load only while this view is mounted — never with the deck in Slides /
// Overview / Present. Research is private to editors + viewers of the deck; it never appears in a
// presentation. Clicking a thumbnail jumps back into the slide editor for that slide.

import { useMemo } from 'react'
import { useQuery, useQueryStatus } from '@rindle/react'
import { deckNotesQuery } from '../../shared/queries'
import { useEditor } from './EditorState'
import { SlideView } from './SlideView'
import { SlideNotesEditor } from './SlideNotesEditor'
import type { DeckRoot, SlideDetail } from './deckDetail'

export function ResearchView({
  slides,
  deck,
}: {
  slides: SlideDetail[]
  deck: DeckRoot | null
}) {
  const editor = useEditor()
  const deckId = editor.deckId
  const notes = useQuery(deckNotesQuery({ deckId }))
  const notesStatus = useQueryStatus(deckNotesQuery({ deckId }))
  // Seed each editor only once the notes query is authoritative — otherwise an editor could mount empty
  // and miss a note that arrives a round-trip later (an open editor doesn't rebase remote edits in).
  const notesResolved = notesStatus !== 'unknown'
  const notesBySlide = useMemo(() => {
    const m = new Map<string, string>()
    for (const n of notes) m.set(n.slide_id, n.doc)
    return m
  }, [notes])

  if (slides.length === 0) {
    return (
      <div className="research">
        <div className="research__empty">
          No slides yet — add slides, then research them here.
        </div>
      </div>
    )
  }

  return (
    <div className="research">
      <div className="research__scroll">
        <header className="research__intro">
          <h2 className="research__h">Research</h2>
          <p className="research__sub">
            Notes &amp; backing evidence — one doc per slide. Private to you and
            your collaborators; never shown in Present.
          </p>
        </header>
        {slides.map((s, i) => (
          <section className="research__block" key={s.id}>
            <div className="research__aside">
              <button
                className="research__thumb"
                title="Open this slide in the editor"
                onClick={() => {
                  editor.setActiveSlide(s.id)
                  editor.setMode('slide')
                }}
              >
                <SlideView slide={s} deck={deck} width={200} />
                <span className="research__num">{i + 1}</span>
              </button>
            </div>
            <div className="research__notes">
              {notesResolved ? (
                <SlideNotesEditor
                  key={s.id}
                  slideId={s.id}
                  deckId={deckId}
                  doc={notesBySlide.get(s.id) ?? ''}
                  canEdit={editor.canEdit}
                />
              ) : (
                <div className="research__loading">Loading notes…</div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
