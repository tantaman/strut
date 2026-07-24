// The editable body layer, tiled by the slide's layout: one TipTap editor per cell, so a cols-2 slide
// takes text on the left AND the right. The single shared piece both edit surfaces drop into their
// scaled `.slide-canvas` used by the scrolling card editor, so cells tile identically and match the read
// renderer (render.tsx
// MarkdownBodies) cell-for-cell.
//
// A full-layout slide is exactly today: one editor filling the canvas, confined by the container's
// --strut-body-pad. A tiled slide positions each cell at its canvas-px rect (cellBoxStyle) with the
// per-cell body vars, and cell 0 keeps living in the `doc` column (useSlideCellEditor idx 0) so nothing
// about an existing slide changes.

import { EditorContent } from '@tiptap/react'
import { cellBoxStyle } from './render'
import { layoutCells, resolveLayout, slidePadScale } from './types'
import { useSlideCellEditor } from './useSlideDocEditor'
import type { Rect } from './types'
import type { SlideDetail } from './deckDetail'

function CellEditor({
  slide,
  idx,
  cell,
  tiled,
  padScale,
  onFocusEditor,
}: {
  slide: SlideDetail
  idx: number
  cell: Rect
  // false = the legacy single body filling the canvas; true = a positioned cell box.
  tiled: boolean
  padScale: number
  onFocusEditor?: (slideId: string) => void
}) {
  const editor = useSlideCellEditor(
    slide,
    idx,
    onFocusEditor ? { onFocus: () => onFocusEditor(slide.id) } : undefined,
  )
  const surface = (
    <div className="strut-md-editor">
      <EditorContent editor={editor} className="strut-md-host" />
      {editor?.isEmpty && (
        <div className="strut-md strut-md__placeholder" aria-hidden="true">
          Start writing…
        </div>
      )}
    </div>
  )
  if (!tiled) return surface
  return (
    <div className="strut-md-cell" style={cellBoxStyle(cell, padScale)}>
      {surface}
    </div>
  )
}

export function SlideBodyEditors({
  slide,
  onFocusEditor,
}: {
  slide: SlideDetail
  onFocusEditor?: (slideId: string) => void
}) {
  const layout = resolveLayout(slide.layout)
  const padScale = slidePadScale(slide)
  if (layout === '') {
    return (
      <CellEditor
        slide={slide}
        idx={0}
        cell={layoutCells('')[0]}
        tiled={false}
        padScale={padScale}
        onFocusEditor={onFocusEditor}
      />
    )
  }
  // Each CellEditor owns its own editor hook (keyed by cell index), so changing the layout mounts/unmounts
  // whole cell editors rather than reordering hooks — hook order stays stable within each cell.
  return (
    <>
      {layoutCells(layout).map((cell, i) => (
        <CellEditor
          key={i}
          slide={slide}
          idx={i}
          cell={cell}
          tiled
          padScale={padScale}
          onFocusEditor={onFocusEditor}
        />
      ))}
    </>
  )
}
