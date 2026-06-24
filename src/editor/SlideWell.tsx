// The slide well (spec §5.1): live thumbnails, click to make active, ctrl/shift-click to multi-select,
// drag to reorder (fractional index), × to delete, + to add a blank slide.

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { newId, OVERVIEW_CARD_GAP } from '../config'
import { keyAfter, keyBetween } from '../lib/order'
import { useApp, useMutate } from '../rindle/RindleProvider'
import { useEditor } from './EditorState'
import { useHistory } from './UndoProvider'
import { reinsertComponent } from './componentOps'
import { readSlideComponents } from './deckIO'
import type { AnyComponent } from './types'
import { SlideThumb } from './SlideThumb'

export interface SlideRow {
  id: string
  deck_id: string
  sort: string
  x: number
  y: number
  z: number
  rotate_x: number
  rotate_y: number
  rotate_z: number
  imp_scale: number
  background: string
  surface: string
}

export function SlideWell({
  slides,
  deck,
}: {
  slides: SlideRow[]
  deck: { background: string } | null
}) {
  const editor = useEditor()
  const mutate = useMutate()
  const app = useApp()
  const history = useHistory()
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropIdx, setDropIdx] = useState<number | null>(null)

  function addSlide() {
    const last = slides[slides.length - 1]
    const id = newId()
    const args = {
      id,
      deckId: editor.deckId,
      sort: keyAfter(last?.sort),
      x: slides.length * OVERVIEW_CARD_GAP,
      y: 0,
      now: Date.now(),
    }
    mutate.addSlide(args)
    editor.setActiveSlide(id)
    history.push({
      label: 'Add slide',
      redo: () => mutate.addSlide(args),
      undo: () =>
        mutate.deleteSlide({
          id,
          textIds: [],
          imageIds: [],
          shapeIds: [],
          videoIds: [],
          webframeIds: [],
        }),
    })
  }

  // Restore a deleted slide (row + transform + theme + all its components).
  function restoreSlide(s: SlideRow, comps: AnyComponent[]) {
    const now = Date.now()
    mutate.addSlide({
      id: s.id,
      deckId: s.deck_id,
      sort: s.sort,
      x: s.x,
      y: s.y,
      now,
    })
    mutate.setSlideTransform({
      id: s.id,
      x: s.x,
      y: s.y,
      z: s.z,
      rotate_x: s.rotate_x,
      rotate_y: s.rotate_y,
      rotate_z: s.rotate_z,
      imp_scale: s.imp_scale,
      now,
    })
    if (s.background || s.surface)
      mutate.setSlideTheme({
        id: s.id,
        background: s.background,
        surface: s.surface,
        now,
      })
    for (const c of comps) reinsertComponent(mutate, c)
  }

  async function deleteSlide(s: SlideRow, idx: number) {
    // Snapshot components first so undo can restore them — the server cascades component rows by
    // slide_id (see RINDLE_NOTES.md cascade), so once deleted they're gone unless we re-add them.
    const comps = await readSlideComponents(app.store, s.id)
    const ids = {
      textIds: comps.filter((c) => c.kind === 'text').map((c) => c.id),
      imageIds: comps.filter((c) => c.kind === 'image').map((c) => c.id),
      shapeIds: comps.filter((c) => c.kind === 'shape').map((c) => c.id),
      videoIds: comps.filter((c) => c.kind === 'video').map((c) => c.id),
      webframeIds: comps.filter((c) => c.kind === 'webframe').map((c) => c.id),
    }
    const del = () => mutate.deleteSlide({ id: s.id, ...ids })
    del()
    history.push({
      label: 'Delete slide',
      redo: del,
      undo: () => restoreSlide(s, comps),
    })
    if (editor.activeSlideId === s.id) {
      const neighbor = slides[idx + 1] ?? slides[idx - 1] ?? null
      editor.setActiveSlide(neighbor?.id ?? null)
    }
  }

  function drop(targetIdx: number) {
    if (!dragId) return
    const moving = slides.find((s) => s.id === dragId)
    const without = slides.filter((s) => s.id !== dragId)
    const before = without[targetIdx - 1]
    const after = without[targetIdx]
    const sort = keyBetween(before?.sort, after?.sort)
    const fromSort = moving?.sort
    mutate.reorderSlide({ id: dragId, sort })
    if (fromSort !== undefined && fromSort !== sort) {
      const id = dragId
      history.push({
        label: 'Reorder slide',
        redo: () => mutate.reorderSlide({ id, sort }),
        undo: () => mutate.reorderSlide({ id, sort: fromSort }),
      })
    }
    setDragId(null)
    setDropIdx(null)
  }

  return (
    <div className="well">
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={
            'well__slide' +
            (editor.activeSlideId === s.id ? ' is-active' : '') +
            (editor.isSelected(s.id) ? ' is-selected' : '') +
            (dropIdx === i ? ' is-drop-target' : '')
          }
          draggable={editor.canEdit}
          onDragStart={() => editor.canEdit && setDragId(s.id)}
          onDragOver={(e) => {
            if (!editor.canEdit) return
            e.preventDefault()
            setDropIdx(i)
          }}
          onDrop={() => editor.canEdit && drop(i)}
          onClick={() => editor.setActiveSlide(s.id)}
        >
          <div className="well__thumb">
            <SlideThumb slide={s} deck={deck} width={148} />
          </div>
          <span className="well__badge">{i + 1}</span>
          {editor.canEdit && (
            <button
              className="well__del"
              onClick={(e) => {
                e.stopPropagation()
                deleteSlide(s, i)
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      {editor.canEdit && (
        <button
          className="well__add"
          onClick={addSlide}
          onDragOver={(e) => {
            e.preventDefault()
            setDropIdx(slides.length)
          }}
          onDrop={() => drop(slides.length)}
        >
          <Plus size={16} /> Slide
        </button>
      )}
    </div>
  )
}
