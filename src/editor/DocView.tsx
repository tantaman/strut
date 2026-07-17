// The Doc surface — a deck mode alongside Slides / Overview / Research. Every slide is rendered as a
// fit-scaled 16:9 card in ONE vertical scroll, each body editable in place, so you read and edit the deck
// as a document instead of selecting one slide at a time. The well stays mounted beside it as a minimap:
// it tracks the scroll rather than gating the edit.
//
// Cards stay SLIDE-SHAPED (1280×720 scaled to the column, not reflowed into prose): the fixed geometry is
// the contract LockedObjects, the spatial components and the impress export all depend on, and it keeps
// what you edit identical to what renders. It also makes this virtualizer simpler than Research's —
// every row is exactly `cardH + DOC_GAP`, so `estimateSize` is EXACT and nothing needs measureElement.
//
// Doc mode edits BODIES. A spatial slide (render_mode '') has no editable body here, so it renders as a
// live read-only composite; click it to jump to Slides mode where the object canvas lives.
//
// Two couplings to "one active slide" are resolved here rather than pushed onto the rest of the editor:
//   • The header/AI still act on `?slide=` — so the card under the viewport center drives it (debounced),
//     and focusing a card's text claims it too. Both keep the URL deep-linkable and the Present/Esc
//     round-trip intact.
//   • N editors must not mean N format bars — ONE bar is hoisted here and bound to whichever card has
//     focus (FormatBar subscribes to its editor itself, so it tracks a selection it isn't rendered near).
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
import { EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { SLIDE_H, SLIDE_W } from '../config'
import { useEditor } from './EditorState'
import { useAddSlide } from './useAddSlide'
import { useSlideDocEditor } from './useSlideDocEditor'
import { FormatBar } from './TipTapSlideEditor'
import { DocRegionDrag, useDropImage } from './DocRegion'
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const addSlideAt = useAddSlide(slides, deck)
  // One scale for every card, from the column width — so a card's height is known without measuring it.
  const [colW, setColW] = useState(DOC_COL_MAX)
  // The column starts below the scroll box's top padding; `scrollMargin` offsets the virtualizer past it.
  const [scrollMargin, setScrollMargin] = useState(0)
  const [focusedEditor, setFocusedEditor] = useState<Editor | null>(null)
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
    // Observing the column catches both window resizes and the well/chat rails opening beside it. Its
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
    (ed: Editor, slideId: string) => {
      setFocusedEditor(ed)
      // Typing in a card makes it the slide the header and the AI act on.
      if (slideId !== editor.activeSlideId) {
        suppressScrollTo.current = slideId
        editor.setActiveSlide(slideId)
      }
    },
    [editor],
  )
  const onBlurEditor = useCallback((ed: Editor) => {
    setFocusedEditor((cur) => (cur === ed ? null : cur))
  }, [])

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
      {/* One bar for the whole column, floating over the top gutter — bound to the focused card. */}
      <FormatBar editor={focusedEditor} deck={deck} />
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
                  onFocusEditor={onFocusEditor}
                  onBlurEditor={onBlurEditor}
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
  onFocusEditor,
  onBlurEditor,
}: {
  slide: SlideDetail
  deck: DeckRoot | null
  colW: number
  cardH: number
  scale: number
  onFocusEditor: (ed: Editor, slideId: string) => void
  onBlurEditor: (ed: Editor) => void
}) {
  const editor = useEditor()
  const active = slide.id === editor.activeSlideId
  // Body-editable only where a body IS the edit layer. Flipping render_mode swaps which component
  // renders, remounting the card — the same branch Stage makes, for the same reason.
  const editable = editor.canEdit && slide.render_mode === 'markdown'
  const drop = useDropImage(slide)
  return (
    <div
      className={
        'doc__card' +
        (active ? ' is-active' : '') +
        (drop.side ? ' is-dropping' : '')
      }
      style={{ width: colW, height: cardH }}
      // Drop an image on a card and it half-bleeds to the side you dropped it, with the body moving
      // to the other half on its own. The whole card is the target — the side is the drop's x.
      onDragOver={editable ? drop.onDragOver : undefined}
      onDragLeave={editable ? drop.onDragLeave : undefined}
      onDrop={editable ? drop.onDrop : undefined}
    >
      {editable ? (
        <DocCardBody
          slide={slide}
          deck={deck}
          scale={scale}
          onFocusEditor={onFocusEditor}
          onBlurEditor={onBlurEditor}
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
      {/* The grip + snap preview ride above the scaled canvas, in the card's own coordinate space. */}
      {editable && <DocRegionDrag slide={slide} deck={deck} scale={scale} />}
      {drop.busy && <div className="doc__drop-busy">Uploading image…</div>}
    </div>
  )
}

function DocCardBody({
  slide,
  deck,
  scale,
  onFocusEditor,
  onBlurEditor,
}: {
  slide: SlideDetail
  deck: DeckRoot | null
  scale: number
  onFocusEditor: (ed: Editor, slideId: string) => void
  onBlurEditor: (ed: Editor) => void
}) {
  const ed = useSlideDocEditor(slide, {
    onFocus: (e) => onFocusEditor(e, slide.id),
    onBlur: (e) => onBlurEditor(e),
  })
  // Scrolling a focused card out of the window destroys its editor; drop the shared bar with it.
  useEffect(
    () => () => {
      if (ed) onBlurEditor(ed)
    },
    [ed, onBlurEditor],
  )
  return (
    <DocCanvas slide={slide} deck={deck} scale={scale}>
      <EditorContent editor={ed} className="strut-md-host" />
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
