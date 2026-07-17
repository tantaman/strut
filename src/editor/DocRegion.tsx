// Partitioning a slide from Doc mode, without a layout gallery.
//
// Two gestures, no menu:
//   • DROP an image on a card — it becomes the slide's half-bleed background on the side you dropped
//     it, and the body moves to the other half on its own (nobody writes `body_region`; auto derives
//     it from the image — see resolveBodyRegion). Delete the image and the text goes back full-bleed.
//   • DRAG the body's grip — the five regions preview live on the real slide, drop to pin one.
//
// Pinning is only recorded when it DISAGREES with what auto would derive. Drag the body back to the
// side the image already implies and the pin clears to '' — so "put it back" needs no extra affordance,
// and the column keeps meaning "the author overrode this", not "the author happened to drag once".

import { useCallback, useRef, useState } from 'react'
import { GripVertical } from 'lucide-react'
import { useMutate } from '../rindle/RindleProvider'
import { useHistory } from './UndoProvider'
import { uploadImage } from './upload'
import {
  bodyRegionRect,
  makeBackgroundImageToken,
  parseBackgroundImageToken,
  regionAtPoint,
  resolveBodyRegion,
  resolveBackgroundImage,
} from './types'
import type { BodyRegion } from './types'
import type { DeckRoot, SlideDetail } from './deckDetail'

/** The region this slide's body currently occupies, resolved exactly as themeVars resolves it. */
export function slideBodyRegion(
  slide: SlideDetail,
  deck: DeckRoot | null,
): BodyRegion {
  return resolveBodyRegion(slide.body_region, imageLayout(slide, deck))
}

/** What the body would do with no pin at all — the value a pin has to disagree with to be worth storing. */
function autoRegion(slide: SlideDetail, deck: DeckRoot | null): BodyRegion {
  return resolveBodyRegion('', imageLayout(slide, deck))
}

/** The layout of whatever half-bleed image this slide resolves to — the sole input to the auto rule. */
function imageLayout(slide: SlideDetail, deck: DeckRoot | null) {
  return resolveBackgroundImage(slide.background, deck?.background)?.layout
}

/** Drop an image onto a card: upload it, make it the slide's half-bleed background on the side it was
 *  dropped, and let the body follow. Returns a handler set for the card element. */
export function useDropImage(slide: SlideDetail) {
  const mutate = useMutate()
  const history = useHistory()
  const [busy, setBusy] = useState(false)
  const [side, setSide] = useState<'left' | 'right' | null>(null)

  const sideAt = (e: React.DragEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return e.clientX - r.left < r.width / 2 ? 'left' : 'right'
  }

  const hasImage = (dt: DataTransfer | null) =>
    !!dt && Array.from(dt.items).some((i) => i.type.startsWith('image/'))

  const onDragOver = (e: React.DragEvent<HTMLElement>) => {
    if (!hasImage(e.dataTransfer)) return
    e.preventDefault() // required, or the browser refuses the drop
    e.dataTransfer.dropEffect = 'copy'
    setSide(sideAt(e))
  }
  const onDragLeave = () => setSide(null)

  const onDrop = async (e: React.DragEvent<HTMLElement>) => {
    const file = Array.from(e.dataTransfer.files).find((f) =>
      f.type.startsWith('image/'),
    )
    if (!file) return
    e.preventDefault()
    const dropped = sideAt(e)
    setSide(null)
    setBusy(true)
    try {
      const src = await uploadImage(file)
      const before = slide.background
      // Keep whatever effects the slide already had; only the src + side are ours to set.
      const prev = parseBackgroundImageToken(before)
      const after = makeBackgroundImageToken(src, {
        layout: dropped,
        fade: prev?.fade ?? false,
        blur: prev?.blur ?? false,
        mask: prev?.mask ?? false,
      })
      const apply = (background: string) =>
        mutate.setSlideTheme({ id: slide.id, background, now: Date.now() })
      apply(after)
      history.push({
        label: 'Add image',
        redo: () => apply(after),
        undo: () => apply(before),
      })
    } catch (err) {
      console.error('[doc] image drop failed', err)
    } finally {
      setBusy(false)
    }
  }

  return { onDragOver, onDragLeave, onDrop, side, busy }
}

/** The body's grip + the live snap preview. Sits above the scaled canvas in the card's own coordinate
 *  space, so the grip stays a constant size whatever the column width. */
export function DocRegionDrag({
  slide,
  deck,
  scale,
}: {
  slide: SlideDetail
  deck: DeckRoot | null
  scale: number
}) {
  const mutate = useMutate()
  const history = useHistory()
  const current = slideBodyRegion(slide, deck)
  const [dragging, setDragging] = useState<BodyRegion | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const commit = useCallback(
    (next: BodyRegion) => {
      const before = slide.body_region
      // Only store a pin that disagrees with the derivation — agreeing with auto means "stop overriding".
      const after = next === autoRegion(slide, deck) ? '' : next
      if (after === before) return
      const apply = (body_region: string) =>
        mutate.setSlideTheme({ id: slide.id, body_region, now: Date.now() })
      apply(after)
      history.push({
        label: 'Move body',
        redo: () => apply(after),
        undo: () => apply(before),
      })
    },
    [slide, deck, mutate, history],
  )

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    const host = cardRef.current
    if (!host) return
    const rect = host.getBoundingClientRect()
    const at = (ev: PointerEvent) =>
      regionAtPoint(
        (ev.clientX - rect.left) / rect.width,
        (ev.clientY - rect.top) / rect.height,
      )
    setDragging(current)
    const move = (ev: PointerEvent) => setDragging(at(ev))
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setDragging(null)
      commit(at(ev))
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const grip = bodyRegionRect(current)
  const preview = dragging ? bodyRegionRect(dragging) : null

  return (
    <div className="doc__region" ref={cardRef}>
      <button
        className="doc__grip"
        title="Drag to move the text — to a side, or to the middle for full width"
        onPointerDown={onPointerDown}
        style={{ left: grip.x * scale, top: grip.y * scale }}
      >
        <GripVertical size={14} />
      </button>
      {preview && (
        <div
          className="doc__snap"
          style={{
            left: preview.x * scale,
            top: preview.y * scale,
            width: preview.w * scale,
            height: preview.h * scale,
          }}
        >
          <span className="doc__snap-lbl">
            {dragging === 'full' ? 'Full width' : dragging}
          </span>
        </div>
      )}
      {/* The half the body is vacating — shown only mid-drag, so a card at rest stays clean. */}
      {dragging && dragging !== 'full' && (
        <div
          className="doc__snap doc__snap--other"
          style={vacatedStyle(dragging, scale)}
        />
      )}
    </div>
  )
}

/** The complementary half — where an image would go. Mirrors bodyRegionRect's opposite. */
function vacatedStyle(region: BodyRegion, scale: number) {
  const opposite: Record<BodyRegion, BodyRegion> = {
    left: 'right',
    right: 'left',
    top: 'bottom',
    bottom: 'top',
    full: 'full',
  }
  const r = bodyRegionRect(opposite[region])
  return {
    left: r.x * scale,
    top: r.y * scale,
    width: r.w * scale,
    height: r.h * scale,
  }
}
