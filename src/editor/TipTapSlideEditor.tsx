// WYSIWYG markdown-mode editing, directly on the slide (replaces the old split textarea-below-preview).
// A TipTap editor is mounted INTO the same `.strut-md` scope the read-only surface uses, at the same
// fit-to-slide scale, so what you edit is literally what renders. The stored `doc` (TipTap JSON) is the
// source of truth; the write model lives in `useSlideDocEditor` (shared with Doc mode) — it streams via
// Rindle's `.folded` on every keystroke and commits ONE undo step per edit session on blur.
//
// Formatting carries NO chrome: markdown input rules (`# `, `- `, `**bold**`) and the `/` menu do it
// from the keys, so the slide is the only thing on screen. The deck theme supplies the rest — font,
// color, and alignment are the theme's job (and the AI's), not a per-selection dial on every slide.
//
// This is the STAGE's editor: one slide, fit to the viewport. Doc mode composes the same pieces
// differently (a column of N scaled cards) — see DocView.

import { useRef } from 'react'
import type { ReactNode } from 'react'
import { SLIDE_H, SLIDE_W } from '../config'
import { useFitScale } from './useFitScale'
import { SlideBodyEditors } from './SlideBodyEditors'
import { useDropImage, DropCellHighlight } from './imageDrop'
import { BackgroundImageLayer, themeVars } from './render'
import { resolveBackground, resolveBackgroundImage } from './types'
import type { DeckThemeFields } from './types'
import type { SlideDetail } from './deckDetail'

type MdDeck = (DeckThemeFields & { background?: string | null }) | null

export function TipTapSlideEditor({
  slide,
  deck,
  children,
}: {
  slide: SlideDetail
  deck: MdDeck
  // The locked Objects overlay (LockedObjects) — the slide's positioned components, shown on top of
  // the editable body but inert, so what you see while editing the body matches what renders.
  children?: ReactNode
}) {
  const previewRef = useRef<HTMLDivElement>(null)
  const scale = useFitScale(previewRef, SLIDE_W, SLIDE_H)
  const drop = useDropImage(slide, deck)

  const background = resolveBackground(
    slide.background,
    deck?.background ?? undefined,
  )
  const bgImage = resolveBackgroundImage(
    slide.background,
    deck?.background ?? undefined,
  )

  return (
    <div
      className="md-preview"
      ref={previewRef}
      onDragOver={drop.onDragOver}
      onDragLeave={drop.onDragLeave}
      onDrop={drop.onDrop}
    >
      <div
        className="slide-surface"
        style={{ width: SLIDE_W * scale, height: SLIDE_H * scale }}
      >
        <div
          className="slide-canvas strut-surface"
          style={{
            width: SLIDE_W,
            height: SLIDE_H,
            transform: `scale(${scale})`,
            background,
            ...themeVars(deck, slide),
          }}
        >
          <BackgroundImageLayer image={bgImage} />
          <SlideBodyEditors slide={slide} />
          {children}
        </div>
        {/* Drop an image → it snaps to a cell (fill an empty one, or land as a movable object on one
            with text). The highlight rides above the scaled canvas, in the surface's coordinate space. */}
        <DropCellHighlight
          slide={slide}
          deck={deck}
          index={drop.cellIndex}
          scale={scale}
        />
        {drop.busy && <div className="doc__drop-busy">Uploading image…</div>}
      </div>
    </div>
  )
}
