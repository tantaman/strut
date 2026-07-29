// Drop an image FILE onto a slide and it becomes an aspect-correct positioned object at the pointer.
// There is no parallel body/layout occupancy model: doc-first and precision reveal the same image box,
// and the user can refine it spatially from there.

import { useRef, useState } from 'react'
import { newId, SLIDE_H, SLIDE_W } from '../config'
import { useMutate } from '../rindle/RindleProvider'
import { useHistory } from './UndoProvider'
import { reinsertComponent, zNow } from './componentOps'
import { componentSize } from './render'
import {
  ComponentDataReader,
  componentRefKey,
  mergeComponentRefs,
} from './componentFragments'
import { uploadImage } from './upload'
import type { AnyComponent, Rect } from './types'
import type { SlideDetail } from './deckDetail'

const imageFile = (dt: DataTransfer | null): File | null => {
  if (!dt) return null
  const file = Array.from(dt.files).find((f) => f.type.startsWith('image/'))
  if (file) return file
  const item = Array.from(dt.items).find(
    (i) => i.kind === 'file' && i.type.startsWith('image/'),
  )
  return item?.getAsFile() ?? null
}

const hasImageFile = (dt: DataTransfer | null) =>
  imageFile(dt) != null ||
  (!!dt && Array.from(dt.items).some((i) => i.type.startsWith('image/')))

// The `.slide-canvas` is the fixed 1280×720 stage, transform-origin top-left, so its on-screen rect maps
// linearly back to canvas px. Resolve it whether the handler sits ON the canvas (Stage) or on an ancestor
// card (Doc). Read synchronously (before any await) — React nulls the event after the handler returns.
function canvasHit(
  e: React.DragEvent<HTMLElement>,
): { cx: number; cy: number } | null {
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
  return { cx, cy }
}

// The box for a placed image: roughly half the available bounds, preserving its natural aspect, centred
// on the drop point and clamped to the slide. `dims` null (aspect unknown) falls back to 3:2.
function placedBox(
  bounds: Rect,
  cx: number,
  cy: number,
  dims: { w: number; h: number } | null,
): Rect {
  const ratio = dims && dims.h ? dims.w / dims.h : 3 / 2
  let w = Math.min(Math.max(bounds.w * 0.5, 240), 560)
  let h = w / ratio
  const maxW = bounds.w * 0.9
  const maxH = bounds.h * 0.9
  if (w > maxW) ((w = maxW), (h = w / ratio))
  if (h > maxH) ((h = maxH), (w = h * ratio))
  const x = Math.max(bounds.x, Math.min(cx - w / 2, bounds.x + bounds.w - w))
  const y = Math.max(bounds.y, Math.min(cy - h / 2, bounds.y + bounds.h - h))
  return { x, y, w, h }
}

// Natural pixel size of the file, decoded locally (no extra network round-trip). Used only to keep a
// placed object's aspect right; the fill path doesn't need it (cover handles aspect by cropping).
async function fileDims(file: File): Promise<{ w: number; h: number } | null> {
  try {
    const bmp = await createImageBitmap(file)
    const dims = { w: bmp.width, h: bmp.height }
    bmp.close()
    return dims
  } catch {
    return null
  }
}

const SLIDE_RECT: Rect = { x: 0, y: 0, w: SLIDE_W, h: SLIDE_H }

/** Drag-and-drop image handlers for a slide surface. `preview` is the box that will be inserted. */
export function useDropImage(slide: SlideDetail) {
  const mutate = useMutate()
  const history = useHistory()
  const [busy, setBusy] = useState(false)
  const [active, setActive] = useState(false)
  const [preview, setPreview] = useState<Rect | null>(null)
  const previewHit = useRef<{ cx: number; cy: number } | null>(null)
  const dragImage = useRef<{
    key: string
    resolved: boolean
    dims: { w: number; h: number } | null
    promise: Promise<{ w: number; h: number } | null>
  } | null>(null)

  const prepareImage = (file: File) => {
    const key = `${file.name}:${file.type}:${file.size}:${file.lastModified}`
    if (dragImage.current?.key === key) return dragImage.current
    const entry = {
      key,
      resolved: false,
      dims: null as { w: number; h: number } | null,
      promise: Promise.resolve(null) as Promise<{
        w: number
        h: number
      } | null>,
    }
    entry.promise = fileDims(file).then((dims) => {
      entry.resolved = true
      entry.dims = dims
      if (dragImage.current === entry && previewHit.current) {
        const { cx, cy } = previewHit.current
        setPreview(placedBox(SLIDE_RECT, cx, cy, dims))
      }
      return dims
    })
    dragImage.current = entry
    return entry
  }

  const onDragOver = (e: React.DragEvent<HTMLElement>) => {
    if (!hasImageFile(e.dataTransfer)) return
    e.preventDefault() // required, or the browser refuses the drop
    e.dataTransfer.dropEffect = 'copy'
    setActive(true)
    const hit = canvasHit(e)
    previewHit.current = hit
    if (!hit) {
      setPreview(null)
      return
    }
    const file = imageFile(e.dataTransfer)
    if (!file) {
      // OS file drags are commonly in protected mode until `drop`: the MIME type is visible through
      // `items`, but getAsFile()/files expose no bytes to decode. Use the established 3:2 preview in
      // that case; the inserted image still uses its decoded natural aspect after the drop.
      setPreview(placedBox(SLIDE_RECT, hit.cx, hit.cy, null))
      return
    }
    const prepared = prepareImage(file)
    setPreview(
      prepared.resolved
        ? placedBox(SLIDE_RECT, hit.cx, hit.cy, prepared.dims)
        : null,
    )
  }
  const onDragLeave = () => {
    previewHit.current = null
    setActive(false)
    setPreview(null)
  }

  const onDrop = async (e: React.DragEvent<HTMLElement>) => {
    const file = imageFile(e.dataTransfer)
    if (!file) return
    e.preventDefault()
    const hit = canvasHit(e) // read BEFORE awaiting (event is pooled)
    previewHit.current = null
    setActive(false)
    setPreview(null)
    if (!hit) return
    setBusy(true)
    try {
      const [dims, src] = await Promise.all([
        prepareImage(file).promise,
        uploadImage(file),
      ])
      const box = placedBox(SLIDE_RECT, hit.cx, hit.cy, dims)
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

  return { onDragOver, onDragLeave, onDrop, active, preview, busy }
}

/** Quiet preview of the exact image box that will be inserted. */
export function DropImageHighlight({
  rect,
  scale,
}: {
  rect: Rect | null
  scale: number
}) {
  if (!rect) return null
  return (
    <div
      className="drop-image-preview"
      style={{
        left: rect.x * scale,
        top: rect.y * scale,
        width: rect.w * scale,
        height: rect.h * scale,
      }}
    />
  )
}

/** Hover-to-remove for images placed on an editor card. The card's positioned-object layer is inert so
 *  clicks reach body text, so this overlays a quiet × on each photo instead of forcing a separate focus
 *  step. Removal is ONE undo (the exact inverse of the drop).
 *  Positioned in the card's own coordinate space (canvas px × scale), so the ×
 *  stays a constant on-screen size at any column width. The overlay root is inert; only the per-image
 *  boxes opt back into pointer events — over the (opaque) photo they cover, never the surrounding text. */
export function DocImageRemovers({
  slide,
  scale,
}: {
  slide: SlideDetail
  scale: number
}) {
  const mutate = useMutate()
  const history = useHistory()
  const refs = mergeComponentRefs(slide)
  if (refs.length === 0) return null

  const remove = (c: AnyComponent) => {
    const snapshot = { ...c }
    mutate.removeComponent({ id: c.id })
    history.push({
      label: 'Remove image',
      redo: () => mutate.removeComponent({ id: c.id }),
      undo: () => reinsertComponent(mutate, snapshot),
    })
  }

  return (
    <div className="doc__imgtools">
      {refs.map((component) => (
        <ComponentDataReader
          key={componentRefKey(component)}
          component={component}
        >
          {(c) => {
            if (c.kind !== 'image') return null
            const { w, h } = componentSize(c)
            return (
              <div
                className="doc__imgtool"
                style={{
                  left: c.x * scale,
                  top: c.y * scale,
                  width: w * scale,
                  height: h * scale,
                }}
              >
                {/* Centered on the photo itself — always on the image, never under the card's corner
                    controls, and it reads the same whether the photo is full-bleed or a small object. */}
                <button
                  type="button"
                  className="doc__imgtool-del"
                  title="Remove image"
                  onClick={() => remove(c)}
                >
                  ×
                </button>
              </div>
            )
          }}
        </ComponentDataReader>
      ))}
    </div>
  )
}
