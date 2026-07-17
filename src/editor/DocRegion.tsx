// Dropping an image onto a Doc-mode card: it becomes the slide's half-bleed background on the side you
// dropped it, and the body moves to the other half on its own — nobody writes `body_region`; auto
// derives it from the image (see resolveBodyRegion). Delete the image and the text goes back full-bleed.
//
// (Choosing a structured layout is now the LayoutPicker's job — the drag-grip this file used to host is
// gone. This keeps only the image-drop gesture, which composes with any layout.)

import { useState } from 'react'
import { useMutate } from '../rindle/RindleProvider'
import { useHistory } from './UndoProvider'
import { uploadImage } from './upload'
import { makeBackgroundImageToken, parseBackgroundImageToken } from './types'
import type { SlideDetail } from './deckDetail'

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
