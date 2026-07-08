// The Research surface — a deck mode alongside Slides / Overview / Present. Backstage notes + backing
// evidence, ONE free-form doc per slide. Deliberately a single scrolling column of per-slide blocks —
// [slide thumbnail | notes editor] in `sort` order — so this one surface is BOTH the per-slide editor and
// the deck-wide transcluded read. Notes live in the slide_notes side table and sync through their OWN
// query (deckNotes), so they load only while this view is mounted — never with the deck in Slides /
// Overview / Present. Research is private to editors + viewers of the deck; it never appears in a
// presentation. Clicking a thumbnail jumps back into the slide editor for that slide.
//
// Virtualized (spec: don't mount N live TipTap editors at once). Only the blocks in/near the viewport are
// rendered; heights are DYNAMIC (a note grows with its content) so we let @tanstack/react-virtual measure
// each block via `measureElement` (a ResizeObserver re-measures as an editor grows). The intro header is
// real scroll content above the list, so `scrollMargin` offsets the virtualizer past it. Scrolling a
// note far offscreen unmounts its editor, but that's lossless: every keystroke already streams through
// `setSlideNotes.folded`, so a remounted editor re-seeds from the latest synced doc.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
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

  const scrollRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  // The intro header scrolls with the content, so the virtual list starts partway down the scroll box.
  // `scrollMargin` = the list's offset from the scroll top; re-measured on resize (the header rewraps).
  const [scrollMargin, setScrollMargin] = useState(0)
  useLayoutEffect(() => {
    const measure = () => {
      const el = listRef.current
      const scroll = scrollRef.current
      if (!el || !scroll) return
      setScrollMargin(el.offsetTop - scroll.offsetTop)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [slides.length])

  const virtualizer = useVirtualizer({
    count: slides.length,
    getScrollElement: () => scrollRef.current,
    // A block is a 200×112 thumbnail plus a note that's usually a few lines; measureElement corrects it.
    estimateSize: () => 200,
    overscan: 4,
    scrollMargin,
  })
  // Blocks re-flow when the notes query first resolves (editors replace the "Loading…" placeholder and
  // grow to their content); nudge the virtualizer to re-measure once that happens.
  useEffect(() => {
    if (notesResolved) virtualizer.measure()
  }, [notesResolved, virtualizer])

  if (slides.length === 0) {
    return (
      <div className="research">
        <div className="research__empty">
          No slides yet — add slides, then research them here.
        </div>
      </div>
    )
  }

  const items = virtualizer.getVirtualItems()

  return (
    <div className="research">
      <div className="research__scroll" ref={scrollRef}>
        <header className="research__intro">
          <h2 className="research__h">Research</h2>
          <p className="research__sub">
            Notes &amp; backing evidence — one doc per slide. Private to you and
            your collaborators; never shown in Present.
          </p>
        </header>
        <div
          ref={listRef}
          style={{
            position: 'relative',
            width: '100%',
            height: `${virtualizer.getTotalSize()}px`,
          }}
        >
          {items.map((vi) => {
            const s = slides[vi.index]
            const i = vi.index
            return (
              <div
                key={s.id}
                data-index={i}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${vi.start - scrollMargin}px)`,
                }}
              >
                <section
                  className="research__block"
                  // `:first-of-type` no longer identifies the first slide once blocks are windowed —
                  // drop the divider on index 0 explicitly.
                  style={i === 0 ? { borderTop: 'none' } : undefined}
                >
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
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
