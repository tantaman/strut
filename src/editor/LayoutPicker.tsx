// The slide layout picker (Instagram-style): a corner button showing the current tiling, click for a
// popover of layout thumbnails. Picking one writes `slide.layout` as one undo step. Replaces the old
// drag-grip (DocRegion) — you choose a structure from a gallery instead of dragging the body to a half.
//
// Everything visual derives from ONE source, `layoutCells(layout)` in types.ts: the button glyph, the
// popover thumbnails, and the on-card cell outlines are all that same tiling drawn at different sizes —
// so a new preset added to types.ts shows up everywhere with no extra wiring.
//
// PHASE 1: the picker sets the tiling and the slide shows it (cell 0 holds the body; the other cells
// draw as empty outlines — the structure is real and persisted). Making each cell its own editor is the
// next step; nothing here assumes a single body beyond where it renders the placeholder outlines.

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutate } from '../rindle/RindleProvider'
import { useHistory } from './UndoProvider'
import { SLIDE_H, SLIDE_W } from '../config'
import { layoutCells, resolveLayout, SLIDE_LAYOUTS } from './types'
import type { SlideLayout } from './types'
import type { SlideDetail } from './deckDetail'

const LABELS: Record<SlideLayout, string> = {
  '': 'Full',
  'cols-2': 'Two columns',
  'rows-2': 'Two rows',
  tri: 'Three columns',
  'grid-4': 'Grid',
  'split-l': 'Split',
}

const GAP = 6
const VIEWPORT_MARGIN = 8

/** A tiling drawn as filled cells in a 16:9 box — the button icon and each popover thumbnail. Cells
 *  are placed as % of the canvas, so it's literally a shrunk slide; a 1px border in the panel color
 *  reads as the gutter between cells. */
function LayoutGlyph({ layout }: { layout: SlideLayout }) {
  return (
    <span className="lyt-glyph" aria-hidden>
      {layoutCells(layout).map((c, i) => (
        <span
          key={i}
          className="lyt-glyph__cell"
          style={{
            left: `${(c.x / SLIDE_W) * 100}%`,
            top: `${(c.y / SLIDE_H) * 100}%`,
            width: `${(c.w / SLIDE_W) * 100}%`,
            height: `${(c.h / SLIDE_H) * 100}%`,
          }}
        />
      ))}
    </span>
  )
}

export function LayoutPicker({
  slide,
  scale,
}: {
  slide: SlideDetail
  scale: number
}) {
  const mutate = useMutate()
  const history = useHistory()
  const current = resolveLayout(slide.layout)

  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const commit = (next: SlideLayout) => {
    setOpen(false)
    if (next === current) return
    const before = slide.layout
    const apply = (layout: string) =>
      mutate.setSlideTheme({ id: slide.id, layout, now: Date.now() })
    apply(next)
    history.push({
      label: 'Change layout',
      redo: () => apply(next),
      undo: () => apply(before),
    })
  }

  // Placement mirrors Popchip: viewport coords, below the button, flipped above when the bottom is tight.
  // Anchored to the button itself (not the full-card overlay root), so the menu drops from the corner.
  function place() {
    const anchor = btnRef.current
    if (!anchor) return
    const t = anchor.getBoundingClientRect()
    const panel = panelRef.current
    const pw = panel?.offsetWidth ?? 176
    const ph = panel?.offsetHeight ?? 200
    let left = t.left
    if (left + pw + VIEWPORT_MARGIN > window.innerWidth)
      left = window.innerWidth - pw - VIEWPORT_MARGIN
    left = Math.max(VIEWPORT_MARGIN, left)
    let top = t.bottom + GAP
    if (
      top + ph + VIEWPORT_MARGIN > window.innerHeight &&
      t.top - ph - GAP > VIEWPORT_MARGIN
    )
      top = t.top - ph - GAP
    top = Math.max(VIEWPORT_MARGIN, top)
    setPos({ top, left })
  }

  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    place()
    const frame = window.requestAnimationFrame(place)
    const onMove = () => place()
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      )
        return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  // Cells beyond the first, drawn on the real slide as empty outlines (cell 0 holds the body). Only for a
  // multi-cell layout — a full slide shows nothing extra. In the card's canvas-px × scale coordinate space.
  const emptyCells = current === '' ? [] : layoutCells(current).slice(1)

  return (
    <div className="doc__region" ref={rootRef}>
      {emptyCells.map((c, i) => (
        <div
          key={i}
          className="lyt-cell"
          style={{
            left: c.x * scale,
            top: c.y * scale,
            width: c.w * scale,
            height: c.h * scale,
          }}
        />
      ))}
      <button
        ref={btnRef}
        className={'lyt-btn' + (open ? ' is-open' : '')}
        title="Slide layout"
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <LayoutGlyph layout={current} />
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            className="popover lyt-menu"
            style={{
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              visibility: pos ? 'visible' : 'hidden',
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {SLIDE_LAYOUTS.map((id) => (
              <button
                key={id || 'full'}
                type="button"
                className={'lyt-thumb' + (id === current ? ' is-active' : '')}
                title={LABELS[id]}
                onClick={() => commit(id)}
              >
                <LayoutGlyph layout={id} />
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
