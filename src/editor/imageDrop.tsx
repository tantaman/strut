// Drop an image FILE onto a slide and it becomes an image OBJECT (a `component`, so positioning/resizing
// stay in our hands), snapped to the layout CELL it landed on:
//   • empty cell  → the image FILLS the cell (box = cell rect, object-fit: cover). Dropping a photo into
//                   a blank column is "image beside text" with zero manual sizing; a blank full slide
//                   becomes a full-bleed hero.
//   • occupied cell (has body text) → a modest, aspect-correct object lands AT the drop point instead, so
//                   it never buries the text you already wrote. One rule, no single-vs-multi special case.
//
// (Supersedes the old drop-sets-a-half-bleed-BACKGROUND gesture — images are objects now. Structured
// splits are the LayoutPicker's job; this composes with whatever layout the slide has.)

import { useState } from 'react'
import { newId, SLIDE_W } from '../config'
import { useMutate } from '../rindle/RindleProvider'
import { useHistory } from './UndoProvider'
import { zNow } from './componentOps'
import { uploadImage } from './upload'
import { bodyCells, cellDocAt } from './types'
import { isDocEmpty } from './tiptapDoc'
import type { Rect, DeckPresentationFields } from './types'
import type { SlideDetail } from './deckDetail'

type Deck = DeckPresentationFields | null | undefined

const hasImageFile = (dt: DataTransfer | null) =>
  !!dt && Array.from(dt.items).some((i) => i.type.startsWith('image/'))

// The `.slide-canvas` is the fixed 1280×720 stage, transform-origin top-left, so its on-screen rect maps
// linearly back to canvas px. Resolve it whether the handler sits ON the canvas (Stage) or on an ancestor
// card (Doc). Read synchronously (before any await) — React nulls the event after the handler returns.
function canvasHit(
  e: React.DragEvent<HTMLElement>,
  slide: SlideDetail,
  deck: Deck,
): { cx: number; cy: number; idx: number; cells: Rect[] } | null {
  const el = e.currentTarget
  const canvas = el.classList.contains('slide-canvas')
    ? el
    : el.querySelector<HTMLElement>('.slide-canvas')
  if (!canvas) return null
  const r = canvas.getBoundingClientRect()
  if (!r.width) return null
  const scale = r.width / SLIDE_W
  const cx = (e.clientX - r.left) / scale
  const cy = (e.clientY - r.top) / scale
  const cells = bodyCells(slide, deck)
  let idx = cells.findIndex(
    (c) => cx >= c.x && cx < c.x + c.w && cy >= c.y && cy < c.y + c.h,
  )
  if (idx < 0) idx = 0 // a hair outside any cell (edges/rounding) → the first cell
  return { cx, cy, idx, cells }
}

// The box for an image PLACED on an occupied cell: ~half the cell wide, its natural aspect, centred on the
// drop point and clamped to stay inside the cell. `dims` null (aspect unknown) falls back to 3:2.
function placedBox(
  cell: Rect,
  cx: number,
  cy: number,
  dims: { w: number; h: number } | null,
): Rect {
  const ratio = dims && dims.h ? dims.w / dims.h : 3 / 2
  let w = Math.min(Math.max(cell.w * 0.5, 240), 560)
  let h = w / ratio
  const maxW = cell.w * 0.9
  const maxH = cell.h * 0.9
  if (w > maxW) (w = maxW), (h = w / ratio)
  if (h > maxH) (h = maxH), (w = h * ratio)
  const x = Math.max(cell.x, Math.min(cx - w / 2, cell.x + cell.w - w))
  const y = Math.max(cell.y, Math.min(cy - h / 2, cell.y + cell.h - h))
  return { x, y, w, h }
}

// Natural pixel size of the file, decoded locally (no extra network round-trip). Used only to keep a
// placed object's aspect right; the fill path doesn't need it (cover handles aspect by cropping).
async function fileDims(file: File): Promise<{ w: number; h: number } | null> {
  try {
    const bmp = await createImageBitmap(file)
    const dims = { w: bmp.width, h: bmp.height }
    bmp.close?.()
    return dims
  } catch {
    return null
  }
}

/** Drag-and-drop image handlers for a slide surface (Doc card or Stage canvas). `cellIndex` is the cell
 *  the pointer is currently over (for a drop-target highlight); `busy` is true while uploading. */
export function useDropImage(slide: SlideDetail, deck: Deck) {
  const mutate = useMutate()
  const history = useHistory()
  const [busy, setBusy] = useState(false)
  const [cellIndex, setCellIndex] = useState<number | null>(null)

  const onDragOver = (e: React.DragEvent<HTMLElement>) => {
    if (!hasImageFile(e.dataTransfer)) return
    e.preventDefault() // required, or the browser refuses the drop
    e.dataTransfer.dropEffect = 'copy'
    const hit = canvasHit(e, slide, deck)
    setCellIndex(hit ? hit.idx : null)
  }
  const onDragLeave = () => setCellIndex(null)

  const onDrop = async (e: React.DragEvent<HTMLElement>) => {
    const file = Array.from(e.dataTransfer.files).find((f) =>
      f.type.startsWith('image/'),
    )
    if (!file) return
    e.preventDefault()
    const hit = canvasHit(e, slide, deck) // read BEFORE awaiting (event is pooled)
    setCellIndex(null)
    if (!hit) return
    const cell = hit.cells[hit.idx]
    const occupied = !isDocEmpty(cellDocAt(slide, hit.idx))
    setBusy(true)
    try {
      const dims = occupied ? await fileDims(file) : null
      const src = await uploadImage(file)
      const box = occupied ? placedBox(cell, hit.cx, hit.cy, dims) : cell
      const id = newId()
      const args = {
        id,
        slideId: slide.id,
        x: Math.round(box.x),
        y: Math.round(box.y),
        z_order: zNow(),
        src,
        image_type: '',
        scale_w: Math.round(box.w),
        scale_h: Math.round(box.h),
      }
      const add = () => mutate.addImage(args)
      add()
      history.push({
        label: 'Add image',
        redo: add,
        undo: () => mutate.removeComponent({ id }),
      })
    } catch (err) {
      console.error('[slide] image drop failed', err)
    } finally {
      setBusy(false)
    }
  }

  return { onDragOver, onDragLeave, onDrop, cellIndex, busy }
}

/** The drop-target highlight: a coral wash over the cell the image would land in. Positioned in the
 *  surface's own coordinate space (canvas px × scale), so it lines up with the card/stage cells. */
export function DropCellHighlight({
  slide,
  deck,
  index,
  scale,
}: {
  slide: SlideDetail
  deck: Deck
  index: number | null
  scale: number
}) {
  if (index == null) return null
  const cell = bodyCells(slide, deck)[index]
  if (!cell) return null
  return (
    <div
      className="drop-cell"
      style={{
        left: cell.x * scale,
        top: cell.y * scale,
        width: cell.w * scale,
        height: cell.h * scale,
      }}
    />
  )
}
