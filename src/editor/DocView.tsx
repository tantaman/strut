// The Doc surface — the deck's DEFAULT mode (alongside Slides / Overview / Research). Every slide is
// rendered as a fit-scaled 16:9 card in ONE vertical scroll, each body editable in place, so you read
// and edit the deck as a document instead of selecting one slide at a time. In this mode it owns the
// whole viewport: no header, no well — chrome-free by design, the clean slate for authoring.
//
// Each card has a BACK: flip it over (corner button, or ⌘. on the active card) and its research notes
// are there, editable in place — the index-card metaphor made literal. Front = what the audience sees;
// back = what you (and the AI) know. Same slide_notes store as the Research view, loaded lazily on
// first flip; the back keeps the card's exact geometry (long notes scroll inside it) so the flip never
// disturbs the virtualizer's exact row math.
//
// Cards stay SLIDE-SHAPED (1280×720 scaled to the column, not reflowed into prose): the fixed geometry is
// the contract LockedObjects, the spatial components and the impress export all depend on, and it keeps
// what you edit identical to what renders. It also makes this virtualizer simpler than Research's —
// every row is exactly `cardH + DOC_GAP`, so `estimateSize` is EXACT and nothing needs measureElement.
//
// Doc mode edits BODIES. A spatial slide (render_mode '') has no editable body here, so it renders as a
// live read-only composite; click it to jump to Slides mode where the object canvas lives.
//
// The coupling to "one active slide" is resolved here rather than pushed onto the rest of the editor:
// the AI (and the other modes' chrome) still act on `?slide=` — so the card under the viewport center
// drives it (debounced), and focusing a card's text claims it too. Both keep the URL deep-linkable and
// the Present/Esc round-trip intact. Formatting needs no such hoisting: it rides the keys (markdown
// input rules + the `/` menu), so N cards mean N editors and zero bars.
//
// Windowing unmounts offscreen editors, which is lossless for the same reason it is in Research: every
// keystroke already streams through `setSlideDoc.folded` (keyed per slide), so a remounted editor
// re-seeds from the latest synced doc.

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { SlideBodyEditors } from './SlideBodyEditors'
import type { ReactNode } from 'react'
import { NotebookPen, Plus } from 'lucide-react'
import { useQuery, useQueryStatus } from '@rindle/react'
import { deckNotesQuery } from '../../shared/queries'
import { keyBetween } from '../lib/order'
import { useMutate } from '../rindle/RindleProvider'
import { SLIDE_H, SLIDE_W } from '../config'
import { useEditor } from './EditorState'
import { useHistory } from './UndoProvider'
import { useAddSlide } from './useAddSlide'
import { WellDock } from './WellDock'
import { useDropImage } from './DocRegion'
import { LayoutPicker } from './LayoutPicker'
import { SlideNotesEditor } from './SlideNotesEditor'
import { SlideView } from './SlideView'
import { LockedObjects } from './ObjectsLayer'
import { UserStyle } from './CssEditor'
import { BackgroundImageLayer, themeVars } from './render'
import { resolveBackground, resolveBackgroundImage } from './types'
import type { DeckRoot, SlideDetail } from './deckDetail'

// The gap between two cards — also the hit area of the seam inserter that lives in it.
const DOC_GAP = 28
// The reading column. Wide enough that 1280×720 body type stays legible at ~0.73 scale.
const DOC_COL_MAX = 940

export function DocView({
  slides,
  deck,
}: {
  slides: SlideDetail[]
  deck: DeckRoot | null
}) {
  const editor = useEditor()
  const mutate = useMutate()
  const history = useHistory()
  const scrollRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const addSlideAt = useAddSlide(slides, deck)
  // One scale for every card, from the column width — so a card's height is known without measuring it.
  const [colW, setColW] = useState(DOC_COL_MAX)
  // The column starts below the scroll box's top padding; `scrollMargin` offsets the virtualizer past it.
  const [scrollMargin, setScrollMargin] = useState(0)
  // Until the column has been measured, colW/scrollMargin are defaults, not facts — nothing may act on
  // a scroll offset derived from them.
  const [measured, setMeasured] = useState(false)

  useLayoutEffect(() => {
    const measure = () => {
      const el = listRef.current
      const sc = scrollRef.current
      if (!el || !sc) return
      setColW(el.clientWidth)
      setScrollMargin(el.offsetTop - sc.offsetTop)
      setMeasured(true)
    }
    measure()
    // Observing the column catches both window resizes and the chat rail opening beside it. Its
    // own height changes re-fire this too, but measure() then sets identical values and React bails.
    const ro = new ResizeObserver(measure)
    if (listRef.current) ro.observe(listRef.current)
    return () => ro.disconnect()
    // Re-run on slides.length: an empty deck renders no column at all, so the FIRST measurable list
    // only exists once slides arrive — without this the observer would never attach to it.
  }, [slides.length])

  const scale = colW / SLIDE_W
  const cardH = Math.round(SLIDE_H * scale)
  const rowH = cardH + DOC_GAP

  const virtualizer = useVirtualizer({
    count: slides.length,
    getScrollElement: () => scrollRef.current,
    // Exact, not an estimate: every row is one fixed-ratio card plus the seam above it.
    estimateSize: () => rowH,
    // Keeps a card (and its editor) mounted just off each edge so scrolling doesn't flash empty.
    overscan: 2,
    scrollMargin,
  })
  useEffect(() => {
    virtualizer.measure()
  }, [rowH, virtualizer])

  // The index whose card sits under the viewport center — the single definition of "the slide you're on".
  const shownIndex = useCallback(() => {
    const sc = scrollRef.current
    if (!sc || slides.length === 0 || rowH <= 0) return -1
    const center = sc.scrollTop - scrollMargin + sc.clientHeight / 2
    return Math.min(slides.length - 1, Math.max(0, Math.floor(center / rowH)))
  }, [slides.length, rowH, scrollMargin])

  // The scroll offset that centers card `i`. Computed, not delegated to `scrollToIndex`: the geometry
  // here is exact, whereas scrollToIndex silently no-ops until the virtualizer has measured the scroll
  // box — which it has NOT on the commit where a client-side nav (Present → Esc) mounts this view with
  // the deck already synced. Owning the arithmetic is what makes the opening position deterministic.
  const offsetToCenter = useCallback(
    (i: number) => {
      const sc = scrollRef.current
      if (!sc) return 0
      return Math.max(
        0,
        scrollMargin + i * rowH + cardH / 2 - sc.clientHeight / 2,
      )
    },
    [scrollMargin, rowH, cardH],
  )

  // Take the opening position: the column must land on the incoming `?slide=` (a deep link, or the slide
  // Present handed back on Esc) before it is allowed to report its own scroll. Runs once.
  const restored = useRef(false)
  const prevActive = useRef<string | null>(null)
  useEffect(() => {
    if (restored.current || !measured || slides.length === 0) return
    const sc = scrollRef.current
    if (!sc) return
    const id = editor.activeSlideId
    const i = id ? slides.findIndex((s) => s.id === id) : -1
    // A `?slide=` we can't place yet means the deck hasn't caught up — wait. Restoring now would leave
    // us on slide 1, and the sync below would then write THAT back over where we actually came from.
    if (id && i < 0) return
    restored.current = true
    prevActive.current = id
    if (i > 0) sc.scrollTop = offsetToCenter(i)
  }, [measured, slides, editor.activeSlideId, offsetToCenter])

  // Scroll → `?slide=`. Debounced: a fling past thirty cards should cost ONE navigation, not thirty
  // (each `?slide=` write re-renders the route subtree). 80ms is below the threshold where a deliberate
  // scroll feels laggy.
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (syncTimer.current) clearTimeout(syncTimer.current)
    },
    [],
  )
  const onScroll = useCallback(() => {
    // Before the restore, a scroll event is the column settling at the top — not the user reading. It
    // must not claim `?slide=`, or arriving from Present would overwrite the slide we arrived on.
    if (!restored.current) return
    const i = shownIndex()
    if (i < 0) return
    const id = slides[i].id
    // Always drop a pending sync first — scrolling back to the slide that's already active must also
    // cancel an in-flight navigation to a different one.
    if (syncTimer.current) clearTimeout(syncTimer.current)
    if (id === editor.activeSlideId) return
    syncTimer.current = setTimeout(() => editor.setActiveSlide(id), 80)
  }, [shownIndex, slides, editor])

  // `?slide=` → scroll, but ONLY when the id actually changed. `slides` gets a new identity on every
  // synced keystroke, so a dep-driven re-run would yank the scroll mid-sentence.
  // A card claimed via text focus is already where the user is looking — set active, but don't scroll.
  const suppressScrollTo = useRef<string | null>(null)
  useEffect(() => {
    if (!restored.current) return // the opening restore owns the first positioning
    const id = editor.activeSlideId
    if (id === prevActive.current) return
    if (!id) {
      prevActive.current = id
      return
    }
    const i = slides.findIndex((s) => s.id === id)
    // Not in THIS snapshot yet — e.g. a just-inserted slide, before its row lands. Leave `prevActive`
    // alone so this re-runs when `slides` catches up; consuming it here would drop the scroll for good.
    if (i < 0) return
    prevActive.current = id
    if (id === suppressScrollTo.current) {
      suppressScrollTo.current = null
      return
    }
    // Already under the center? Then the scroll IS this slide (the user put it there) — don't snap.
    if (shownIndex() === i) return
    const sc = scrollRef.current
    if (sc) sc.scrollTop = offsetToCenter(i)
  }, [editor.activeSlideId, slides, shownIndex, offsetToCenter])

  const onFocusEditor = useCallback(
    (slideId: string) => {
      // Typing in a card makes it the slide the header and the AI act on.
      if (slideId !== editor.activeSlideId) {
        suppressScrollTo.current = slideId
        editor.setActiveSlide(slideId)
      }
    },
    [editor],
  )

  // ---- the flip: research notes live on the BACK of each card ----
  // Hoisted, not per-card: windowing unmounts offscreen cards, so card-local state would silently
  // unflip anything you scrolled away from. A Set so several cards can be turned over at once.
  const [flipped, setFlipped] = useState<ReadonlySet<string>>(new Set())
  const toggleFlip = useCallback(
    (id: string) => {
      setFlipped((prev) => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        return next
      })
      // Turning a card over claims it, the same way focusing its text does — the back you're reading
      // is what the AI grounds on. No scroll snap: the card is already where you're looking.
      if (!flipped.has(id) && id !== editor.activeSlideId) {
        suppressScrollTo.current = id
        editor.setActiveSlide(id)
      }
    },
    [flipped, editor],
  )
  // ---- keyboard reorder: ⌘⇧↑ / ⌘⇧↓ moves the active card ----
  // Same fractional-key math as the well's drop(): moving past neighbor j lands between j's far-side
  // pair — the moved slide itself is never in that pair, so the original array indexes are exact.
  const followMove = useRef<string | null>(null)
  const moveSlide = useCallback(
    (id: string, dir: -1 | 1) => {
      const i = slides.findIndex((s) => s.id === id)
      if (i < 0 || i + dir < 0 || i + dir >= slides.length) return
      const before = dir === -1 ? slides[i - 2] : slides[i + 1]
      const after = dir === -1 ? slides[i - 1] : slides[i + 2]
      const sort = keyBetween(before?.sort, after?.sort)
      const fromSort = slides[i].sort
      mutate.reorderSlide({ id, sort })
      history.push({
        label: 'Move slide',
        redo: () => mutate.reorderSlide({ id, sort }),
        undo: () => mutate.reorderSlide({ id, sort: fromSort }),
      })
      followMove.current = id
    },
    [slides, mutate, history],
  )
  // The doc follows the moved card: once the reordered `slides` lands, recenter on it — so repeated
  // presses walk a card down the deck with the card staying put under your eyes. Instant, not smooth:
  // a smooth scroll's intermediate frames would let the scroll→`?slide=` sync claim a passing slide.
  useEffect(() => {
    if (!followMove.current) return
    const i = slides.findIndex((s) => s.id === followMove.current)
    if (i < 0) return
    followMove.current = null
    const sc = scrollRef.current
    if (sc) sc.scrollTop = offsetToCenter(i)
  }, [slides, offsetToCenter])

  // The doc's keyboard verbs, on the ACTIVE card, reachable mid-sentence without leaving the keys
  // (a bare letter would type into the focused TipTap editor):
  //   ⌘.  flip to notes  ·  ⌘⇧↑/↓ move the slide (accepted cost: select-to-doc-edge inside a body —
  //   bodies are a few lines, the deck-level verb earns the combo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const id = editor.activeSlideId
      if (!id) return
      if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggleFlip(id)
      } else if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        (e.key === 'ArrowUp' || e.key === 'ArrowDown')
      ) {
        if (!editor.canEdit) return
        e.preventDefault()
        moveSlide(id, e.key === 'ArrowUp' ? -1 : 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editor.activeSlideId, editor.canEdit, toggleFlip, moveSlide])

  if (slides.length === 0) {
    return (
      <div className="doc">
        <div className="doc__empty">
          {editor.canEdit ? (
            <button className="btn" onClick={() => addSlideAt(0)}>
              <Plus size={15} /> Add the first slide
            </button>
          ) : (
            'No slides yet.'
          )}
        </div>
      </div>
    )
  }

  const items = virtualizer.getVirtualItems()

  return (
    <div className="doc">
      <UserStyle css={deck?.custom_stylesheet} />
      {/* The Dock-well: push the pointer against the left screen edge and the well slides out —
          reorder/jump/delete/add without resident chrome. */}
      <WellDock slides={slides} deck={deck} />
      <div className="doc__scroll" ref={scrollRef} onScroll={onScroll}>
        <div
          className="doc__list"
          ref={listRef}
          style={{ maxWidth: DOC_COL_MAX, height: virtualizer.getTotalSize() }}
        >
          {items.map((vi) => {
            const s = slides[vi.index]
            const i = vi.index
            return (
              <div
                key={s.id}
                data-index={i}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: rowH,
                  transform: `translateY(${vi.start - scrollMargin}px)`,
                }}
              >
                {/* The seam. Insert-here is a spatial act, not a menu act — this is why the column
                    never needs the well's + button. */}
                <div className="doc__seam" style={{ height: DOC_GAP }}>
                  {editor.canEdit && (
                    <button
                      className="doc__ins"
                      title={`Insert a slide before slide ${i + 1}`}
                      onClick={() => addSlideAt(i)}
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
                <DocCard
                  slide={s}
                  deck={deck}
                  colW={colW}
                  cardH={cardH}
                  scale={scale}
                  flipped={flipped.has(s.id)}
                  onToggleFlip={toggleFlip}
                  onFocusEditor={onFocusEditor}
                />
              </div>
            )
          })}
        </div>
        {editor.canEdit && (
          <div
            className="doc__seam doc__seam--end"
            style={{ maxWidth: DOC_COL_MAX }}
          >
            <button
              className="doc__ins"
              title="Add a slide at the end"
              onClick={() => addSlideAt(slides.length)}
            >
              <Plus size={14} /> Add slide
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function DocCard({
  slide,
  deck,
  colW,
  cardH,
  scale,
  flipped,
  onToggleFlip,
  onFocusEditor,
}: {
  slide: SlideDetail
  deck: DeckRoot | null
  colW: number
  cardH: number
  scale: number
  flipped: boolean
  onToggleFlip: (id: string) => void
  onFocusEditor: (slideId: string) => void
}) {
  const editor = useEditor()
  const active = slide.id === editor.activeSlideId
  // Body-editable only where a body IS the edit layer. Flipping render_mode swaps which component
  // renders, remounting the card — the same branch Stage makes, for the same reason.
  const editable = editor.canEdit && slide.render_mode === 'markdown'
  const drop = useDropImage(slide)
  // The back mounts on the FIRST flip and then stays while the card lives: mounting is what starts
  // the notes query (so a deck you never flip never loads notes), and staying is what keeps the
  // flip-back animation from rotating an empty face. Windowing resets this with the card — fine,
  // a remount re-runs the same lazy path.
  const [backMounted, setBackMounted] = useState(false)
  useEffect(() => {
    if (flipped) setBackMounted(true)
  }, [flipped])
  // The back is the drop target for nothing: images land on slide bodies, not in notes.
  const dropActive = editable && !flipped
  return (
    <div
      className={
        'doc__card' +
        (active ? ' is-active' : '') +
        (flipped ? ' is-flipped' : '') +
        (drop.side ? ' is-dropping' : '')
      }
      style={{ width: colW, height: cardH }}
      // Drop an image on a card and it half-bleeds to the side you dropped it, with the body moving
      // to the other half on its own. The whole card is the target — the side is the drop's x.
      onDragOver={dropActive ? drop.onDragOver : undefined}
      onDragLeave={dropActive ? drop.onDragLeave : undefined}
      onDrop={dropActive ? drop.onDrop : undefined}
    >
      <div className="doc__flip">
        <div className="doc__face doc__face--front">
          {editable ? (
            <DocCardBody
              slide={slide}
              deck={deck}
              scale={scale}
              onFocusEditor={onFocusEditor}
            />
          ) : (
            // A spatial slide (or a read-only viewer): the real composited render, not an editor. Objects
            // are placed on the Stage's canvas, so hand it off there.
            <button
              className="doc__static"
              title={
                editor.canEdit
                  ? 'Objects slide — open it in Slides to edit'
                  : undefined
              }
              onClick={() => {
                editor.setActiveSlide(slide.id)
                if (editor.canEdit) editor.setMode('slide')
              }}
            >
              <SlideView slide={slide} deck={deck} width={colW} />
            </button>
          )}
          {/* The layout picker + empty-cell outlines ride above the scaled canvas, in the card's own
              coordinate space, so the button stays a constant size at any column width. */}
          {editable && <LayoutPicker slide={slide} scale={scale} />}
          {drop.busy && <div className="doc__drop-busy">Uploading image…</div>}
        </div>
        <div className="doc__face doc__face--back">
          {backMounted && <DocNotesFace slide={slide} flipped={flipped} />}
        </div>
      </div>
      {/* The flip affordance sits OUTSIDE the rotating pair so it never mirrors — one fixed corner
          button that reads as "this card has a back". Also the target of ⌘. on the active card. */}
      <button
        className="doc__flipbtn"
        title={
          flipped ? 'Flip back to the slide (⌘.)' : 'Notes — flip the card (⌘.)'
        }
        onClick={() => onToggleFlip(slide.id)}
      >
        <NotebookPen size={14} />
      </button>
    </div>
  )
}

// The back of a card: the slide's research notes, editable in place. Same store + editor as the
// Research view (slide_notes via deckNotes) — the flip is another door to the same doc. The query
// subscribes per-face and rindle dedupes, so notes sync only while at least one back is mounted.
// Long notes scroll INSIDE the face: the card's geometry is fixed (the virtualizer's row math and
// the card fiction both depend on it), so the back gets a scrollbar, not a taller box.
function DocNotesFace({
  slide,
  flipped,
}: {
  slide: SlideDetail
  flipped: boolean
}) {
  const editor = useEditor()
  const notes = useQuery(deckNotesQuery({ deckId: editor.deckId }))
  const notesStatus = useQueryStatus(deckNotesQuery({ deckId: editor.deckId }))
  // Seed only once the query is authoritative (an open editor doesn't rebase remote edits in) —
  // the same contract Research honors.
  const resolved = notesStatus !== 'unknown'
  const doc = notes.find((n) => n.slide_id === slide.id)?.doc ?? ''
  return (
    <div className="doc__notes">
      <div className="doc__notes-label">Notes</div>
      {resolved ? (
        <SlideNotesEditor
          slideId={slide.id}
          deckId={editor.deckId}
          doc={doc}
          canEdit={editor.canEdit}
          autoFocus={flipped}
        />
      ) : (
        <div className="doc__notes-loading">Loading notes…</div>
      )}
    </div>
  )
}

function DocCardBody({
  slide,
  deck,
  scale,
  onFocusEditor,
}: {
  slide: SlideDetail
  deck: DeckRoot | null
  scale: number
  onFocusEditor: (slideId: string) => void
}) {
  return (
    <DocCanvas slide={slide} deck={deck} scale={scale}>
      <SlideBodyEditors slide={slide} onFocusEditor={onFocusEditor} />
      {/* The slide's objects, composited on top but inert — so body text is placed in the real layout. */}
      <LockedObjects slide={slide} />
    </DocCanvas>
  )
}

// The scaled 1280×720 canvas, identical in geometry to the Stage's (`.slide-canvas` is absolute,
// top-left, transform-origin top left) — the card is just the box it paints into.
function DocCanvas({
  slide,
  deck,
  scale,
  children,
}: {
  slide: SlideDetail
  deck: DeckRoot | null
  scale: number
  children: ReactNode
}) {
  return (
    <div
      className="slide-canvas strut-surface"
      style={{
        width: SLIDE_W,
        height: SLIDE_H,
        transform: `scale(${scale})`,
        background: resolveBackground(slide.background, deck?.background),
        ...themeVars(deck, slide),
      }}
    >
      <BackgroundImageLayer
        image={resolveBackgroundImage(slide.background, deck?.background)}
      />
      {children}
    </div>
  )
}
