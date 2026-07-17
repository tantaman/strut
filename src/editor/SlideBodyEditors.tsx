// The editable body layer, tiled by the slide's layout: one TipTap editor per cell, so a cols-2 slide
// takes text on the left AND the right. The single shared piece both edit surfaces drop into their
// scaled `.slide-canvas` — the Stage's fit-to-viewport editor (TipTapSlideEditor) and Doc mode's column
// of cards (DocCardBody) — so they tile identically and match the read renderer (render.tsx
// MarkdownBodies) cell-for-cell.
//
// A full-layout slide is exactly today: one editor filling the canvas, confined by the container's
// --strut-body-pad. A tiled slide positions each cell at its canvas-px rect (cellBoxStyle) with the
// per-cell body vars, and cell 0 keeps living in the `doc` column (useSlideCellEditor idx 0) so nothing
// about an existing slide changes.

import { EditorContent } from '@tiptap/react'
import { cellBoxStyle } from './render'
import { layoutCells, resolveLayout } from './types'
import { useSlideCellEditor } from './useSlideDocEditor'
import type { Rect } from './types'
import type { SlideDetail } from './deckDetail'

function CellEditor({
  slide,
  idx,
  cell,
  tiled,
  onFocusEditor,
}: {
  slide: SlideDetail
  idx: number
  cell: Rect
  // false = the legacy single body filling the canvas; true = a positioned cell box.
  tiled: boolean
  onFocusEditor?: (slideId: string) => void
}) {
  const editor = useSlideCellEditor(
    slide,
    idx,
    onFocusEditor ? { onFocus: () => onFocusEditor(slide.id) } : undefined,
  )
  if (!tiled) return <EditorContent editor={editor} className="strut-md-host" />
  return (
    <div className="strut-md-cell" style={cellBoxStyle(cell)}>
      <EditorContent editor={editor} className="strut-md-host" />
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
  if (layout === '') {
    return (
      <CellEditor
        slide={slide}
        idx={0}
        cell={layoutCells('')[0]}
        tiled={false}
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
          onFocusEditor={onFocusEditor}
        />
      ))}
    </>
  )
}
