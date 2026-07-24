// Complete, reversible slide deletion. A slide delete cascades its notes + components on the server, so
// the undo command must snapshot every field and related row BEFORE deleting. Keeping the command here
// (rather than in SlideWell's JSX) makes the destructive path small, explicit, and directly testable.

import { reinsertComponent } from './componentOps'
import type { History } from './history'
import type { StrutApp } from '../rindle/client'
import type { AnyComponent } from './types'
import type { SlideDetail } from './deckDetail'

type Mutate = StrutApp['mutate']

export interface SlideNoteSnapshot {
  deckId: string
  doc: string
}

interface SlideRowSnapshot {
  id: string
  deckId: string
  sort: string
  x: number
  y: number
  z: number
  rotateX: number
  rotateY: number
  rotateZ: number
  impScale: number
  background: string
  surface: string
  markdown: string
  renderMode: '' | 'markdown'
  textAlign: string
  doc: string
  bodyRegion: string
  layout: string
  cells: string
  pad: string
  valign: string
}

export interface DeletedSlideSnapshot {
  slide: SlideRowSnapshot
  components: AnyComponent[]
  note: SlideNoteSnapshot | null
}

/** Copy the live fragment data into ordinary values before the cascade removes its backing rows. */
export function captureDeletedSlide(
  slide: SlideDetail,
  components: AnyComponent[],
  note: SlideNoteSnapshot | null,
): DeletedSlideSnapshot {
  return {
    slide: {
      id: slide.id,
      deckId: slide.deck_id,
      sort: slide.sort,
      x: slide.x,
      y: slide.y,
      z: slide.z,
      rotateX: slide.rotate_x,
      rotateY: slide.rotate_y,
      rotateZ: slide.rotate_z,
      impScale: slide.imp_scale,
      background: slide.background,
      surface: slide.surface,
      markdown: slide.markdown,
      renderMode: slide.render_mode === 'markdown' ? 'markdown' : '',
      textAlign: slide.text_align,
      doc: slide.doc,
      bodyRegion: slide.body_region,
      layout: slide.layout,
      cells: slide.cells,
      pad: slide.pad,
      valign: slide.valign,
    },
    components: components
      .map((component) => ({ ...component }))
      .sort((a, b) => a.z_order - b.z_order),
    note: note ? { ...note } : null,
  }
}

/** Recreate the complete slide subtree from a pre-delete snapshot. */
export function restoreDeletedSlide(
  snapshot: DeletedSlideSnapshot,
  mutate: Mutate,
): void {
  const { slide, components, note } = snapshot
  const now = Date.now()

  mutate.addSlide({
    id: slide.id,
    deckId: slide.deckId,
    sort: slide.sort,
    x: slide.x,
    y: slide.y,
    render_mode: slide.renderMode,
    layout: slide.layout,
    pad: slide.pad,
    valign: slide.valign,
    text_align: slide.textAlign,
    now,
  })
  mutate.setSlideTransform({
    id: slide.id,
    x: slide.x,
    y: slide.y,
    z: slide.z,
    rotate_x: slide.rotateX,
    rotate_y: slide.rotateY,
    rotate_z: slide.rotateZ,
    imp_scale: slide.impScale,
    now,
  })
  mutate.setSlideTheme({
    id: slide.id,
    background: slide.background,
    surface: slide.surface,
    text_align: slide.textAlign,
    body_region: slide.bodyRegion,
    layout: slide.layout,
    pad: slide.pad,
    valign: slide.valign,
    now,
  })
  // Write even empty values: exact restoration should not depend on addSlide's current defaults.
  mutate.setSlideMarkdown({ id: slide.id, markdown: slide.markdown, now })
  mutate.setSlideDoc({ id: slide.id, doc: slide.doc, now })
  mutate.setSlideCells({ id: slide.id, cells: slide.cells, now })
  if (note) {
    mutate.setSlideNotes({
      slideId: slide.id,
      deckId: note.deckId,
      doc: note.doc,
      now,
    })
  }
  for (const component of components) reinsertComponent(mutate, component)
}

/** Apply the cascade and record the complete subtree restoration as one History command. */
export function deleteSlideWithUndo(
  snapshot: DeletedSlideSnapshot,
  mutate: Mutate,
  history: History,
): void {
  const componentIds = snapshot.components.map((component) => component.id)
  const redo = () => mutate.deleteSlide({ id: snapshot.slide.id, componentIds })
  redo()
  history.push({
    label: 'Delete slide',
    redo,
    undo: () => restoreDeletedSlide(snapshot, mutate),
  })
}
