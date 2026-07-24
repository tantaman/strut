// The slide well is summoned, not resident. Push the pointer against the left screen edge and it slides
// out (macOS-Dock style) with reorder, jump, delete, and insert controls. The screen edge is the trigger
// because it's an infinitely deep target
// (Fitts): a flick left always lands on it.
//
// Three behaviors separate "summoned" from "twitchy drawer", all here rather than in SlideWell
// (which renders unchanged inside):
//   • DWELL to reveal (~160ms) — the edge near the browser back-gesture zone gets grazed constantly;
//     the dwell filters incidental touches. LINGER to retract (~300ms) — a wobble off the panel edge
//     shouldn't slam it shut.
//   • PIN while dragging: a drag that starts in the well holds the dock open until dragend/drop, no
//     matter where the pointer goes — retracting mid-drag would eat the reorder. Observed via the
//     bubbling dragstart (capture) + window dragend/drop, so SlideWell needs no changes.
//   • The retracted dock is `visibility: hidden` (CSS), so its buttons leave the tab order entirely.
//
// Touch has no hover edge, so the same well becomes a tap-open bottom tray on small screens. That keeps
// slide management contextual without adding persistent mobile chrome.

import { useEffect, useRef, useState } from 'react'
import { Film, X } from 'lucide-react'
import { SlideWell } from './SlideWell'
import type { DeckRoot, SlideDetail } from './deckDetail'

// Horizontal slack beyond the panel's right edge before the pointer counts as "away".
const AWAY_SLACK = 24

export function WellDock({
  slides,
  deck,
}: {
  slides: SlideDetail[]
  deck: DeckRoot | null
}) {
  const [out, setOut] = useState(false)
  const [pinned, setPinned] = useState(false)
  const dockRef = useRef<HTMLDivElement>(null)
  const revealT = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retractT = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clear = (t: typeof revealT) => {
    if (t.current) {
      clearTimeout(t.current)
      t.current = null
    }
  }

  const reveal = () => {
    clear(retractT)
    if (out || revealT.current) return
    revealT.current = setTimeout(() => {
      revealT.current = null
      setOut(true)
    }, 160)
  }
  const cancelReveal = () => clear(revealT)
  // `stay` also rides mousemove: after a drop unpins with the pointer still on the panel, the next
  // wiggle is what cancels the just-armed retract (mouseenter won't re-fire — the pointer never left).
  const stay = () => clear(retractT)
  const retractSoon = (delay: number) => {
    clear(revealT)
    clear(retractT)
    retractT.current = setTimeout(() => {
      retractT.current = null
      setOut(false)
    }, delay)
  }

  // While the dock is out, pointer POSITION governs the retract — not hover boundary events. The dock
  // slides out UNDER a stationary pointer, and browsers don't re-fire mouseenter for an element that
  // animates beneath the cursor; a fast flick away can then skip the panel between mousemove samples,
  // so its mouseleave never fires either and nothing would ever close it. A window mousemove is
  // sample-rate-proof: far from the panel arms the linger (once — don't reset it per move), on/near
  // the panel cancels it.
  useEffect(() => {
    if (!out || pinned) return
    const onMove = (e: MouseEvent) => {
      const edge =
        (dockRef.current?.getBoundingClientRect().right ?? 200) + AWAY_SLACK
      if (e.clientX > edge) {
        if (!retractT.current) retractSoon(300)
      } else {
        stay()
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [out, pinned])

  // The pin's release: HTML5 drags end at the window, not necessarily over the panel. Arm a generous
  // retract on release — if the pointer is still on the panel, its next move cancels it (see `stay`).
  useEffect(() => {
    if (!pinned) return
    const done = () => {
      setPinned(false)
      retractSoon(500)
    }
    window.addEventListener('dragend', done)
    window.addEventListener('drop', done)
    return () => {
      window.removeEventListener('dragend', done)
      window.removeEventListener('drop', done)
    }
  }, [pinned])

  // Esc dismisses immediately — the pointer parked on the panel shouldn't hold the doc hostage.
  useEffect(() => {
    if (!out) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPinned(false)
        clear(revealT)
        clear(retractT)
        setOut(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [out])

  // Drop any armed timer with the component (mode switch, deck close).
  useEffect(
    () => () => {
      clear(revealT)
      clear(retractT)
    },
    [],
  )

  return (
    <>
      <button
        type="button"
        className={'dock__touch-toggle' + (out ? ' is-out' : '')}
        title={out ? 'Close slide tray' : 'Open slide tray'}
        aria-label={out ? 'Close slide tray' : 'Open slide tray'}
        aria-expanded={out}
        onClick={() => setOut((value) => !value)}
      >
        {out ? <X size={16} /> : <Film size={16} />}
      </button>
      {/* The hot zone + its whisper of an affordance (the ::after pill). Sits UNDER the dock in
          z-order: retracted, it owns the edge; out, the panel covers it and takes the events. */}
      <div
        className="dock__edge"
        onMouseEnter={reveal}
        onMouseLeave={cancelReveal}
      />
      <div
        ref={dockRef}
        className={'dock' + (out ? ' is-out' : '')}
        onDragStartCapture={() => setPinned(true)}
      >
        <SlideWell slides={slides} deck={deck} />
      </div>
    </>
  )
}
