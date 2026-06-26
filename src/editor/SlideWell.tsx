// The slide well (spec §5.1): live thumbnails, click to make active, ctrl/shift-click to multi-select,
// drag to reorder (fractional index), × to delete, + to add a blank slide. Hovering the gap between
// two slides reveals a + to insert a slide there; while dragging, the gap shows a drop indicator.

import { Fragment, useCallback, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { newId, OVERVIEW_CARD_GAP } from '../config'
import { keyBetween } from '../lib/order'
import { useMutate } from '../rindle/RindleProvider'
import { useEditor } from './EditorState'
import { useHistory } from './UndoProvider'
import { reinsertComponent } from './componentOps'
import type { AnyComponent } from './types'
import { SlideView } from './SlideView'
import type { SlideDetail } from './deckDetail'

export function SlideWell({
  slides,
  deck,
}: {
  slides: SlideDetail[]
  deck: { background: string } | null
}) {
  const editor = useEditor()
  const mutate = useMutate()
  const history = useHistory()
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropIdx, setDropIdx] = useState<number | null>(null)
  const componentsBySlideRef = useRef(
    new Map<string, Map<string, AnyComponent>>(),
  )
  const rememberSlideComponent = useCallback(
    (slideId: string, component: AnyComponent) => {
      let components = componentsBySlideRef.current.get(slideId)
      if (!components) {
        components = new Map()
        componentsBySlideRef.current.set(slideId, components)
      }
      components.set(component.id, component)
    },
    [],
  )
  const forgetSlideComponent = useCallback((slideId: string, id: string) => {
    const components = componentsBySlideRef.current.get(slideId)
    components?.delete(id)
    if (components?.size === 0) componentsBySlideRef.current.delete(slideId)
  }, [])
  const componentsForSlide = useCallback((slideId: string) => {
    return [
      ...(componentsBySlideRef.current.get(slideId)?.values() ?? []),
    ].sort((a, b) => a.z_order - b.z_order)
  }, [])
  const slideAt = (index: number): SlideDetail | undefined =>
    index >= 0 && index < slides.length ? slides[index] : undefined

  // Insert a blank slide so it lands at index `at` (0 = before the first slide, slides.length =
  // append). The fractional sort key falls between the neighbors; the 3-D overview position is
  // placed near them too (midpoint when inserting between, one gap past the end when appending).
  function addSlideAt(at: number) {
    const before = slideAt(at - 1)
    const after = slideAt(at)
    const id = newId()
    const between = (
      b: number | undefined,
      a: number | undefined,
      fallback: number,
    ) =>
      b != null && a != null
        ? Math.round((b + a) / 2)
        : b != null
          ? b + OVERVIEW_CARD_GAP
          : a != null
            ? a - OVERVIEW_CARD_GAP
            : fallback
    const args = {
      id,
      deckId: editor.deckId,
      sort: keyBetween(before?.sort, after?.sort),
      x: between(before?.x, after?.x, 0),
      y: between(before?.y, after?.y, 0),
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

  const addSlide = () => addSlideAt(slides.length)

  // Restore a deleted slide (row + transform + theme + all its components).
  function restoreSlide(s: SlideDetail, comps: AnyComponent[]) {
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

  function deleteSlide(s: SlideDetail, idx: number) {
    // Snapshot components first so undo can restore them — the server cascades component rows by
    // slide_id (see RINDLE_NOTES.md cascade), so once deleted they're gone unless we re-add them. The
    // snapshot uses the latest leaf fragment data registered by the thumbnail component readers.
    const comps = componentsForSlide(s.id)
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
      const neighbor = slideAt(idx + 1) ?? slideAt(idx - 1)
      editor.setActiveSlide(neighbor ? neighbor.id : null)
    }
  }

  function endDrag() {
    setDragId(null)
    setDropIdx(null)
  }

  // `at` is an insertion index into the current `slides` array (0 = before first, n = end).
  function drop(at: number) {
    if (!dragId) return endDrag()
    const fromIdx = slides.findIndex((s) => s.id === dragId)
    // Dropping into its own slot (just before or just after itself) is a no-op.
    if (fromIdx === -1 || at === fromIdx || at === fromIdx + 1) return endDrag()
    const moving = slides[fromIdx]
    const without = slides.filter((s) => s.id !== dragId)
    const insIdx = at > fromIdx ? at - 1 : at
    const before =
      insIdx - 1 >= 0 && insIdx - 1 < without.length
        ? without[insIdx - 1]
        : undefined
    const after =
      insIdx >= 0 && insIdx < without.length ? without[insIdx] : undefined
    const sort = keyBetween(before?.sort, after?.sort)
    const fromSort = moving.sort
    mutate.reorderSlide({ id: dragId, sort })
    if (fromSort !== sort) {
      const id = dragId
      history.push({
        label: 'Reorder slide',
        redo: () => mutate.reorderSlide({ id, sort }),
        undo: () => mutate.reorderSlide({ id, sort: fromSort }),
      })
    }
    endDrag()
  }

  // The gap affordance at insertion index `at`: a hover "+" to add a slide there, and — while a drag
  // is in progress — a drop target that lights up when it's where the slide would land.
  function inserter(at: number) {
    if (!editor.canEdit) return null
    const dragging = dragId !== null
    return (
      <div
        key={`ins-${at}`}
        className={
          'well__ins' +
          (dragging ? ' is-dragging' : '') +
          (dragging && dropIdx === at ? ' is-drop-target' : '')
        }
        onDragOver={(e) => {
          if (!dragging) return
          e.preventDefault()
          setDropIdx(at)
        }}
        onDrop={() => drop(at)}
      >
        <span className="well__ins-line" />
        <button
          className="well__ins-btn"
          title="Add a slide here"
          onClick={(e) => {
            e.stopPropagation()
            addSlideAt(at)
          }}
        >
          <Plus size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="well">
      {slides.map((s, i) => (
        <Fragment key={s.id}>
          {inserter(i)}
          <div
            className={
              'well__slide' +
              (editor.activeSlideId === s.id ? ' is-active' : '') +
              (editor.isSelected(s.id) ? ' is-selected' : '') +
              (dragId === s.id ? ' is-dragging' : '')
            }
            draggable={editor.canEdit}
            onDragStart={() => editor.canEdit && setDragId(s.id)}
            onDragEnd={endDrag}
            onDragOver={(e) => {
              if (!editor.canEdit || !dragId) return
              e.preventDefault()
              // Top half drops before this slide, bottom half after it.
              const r = e.currentTarget.getBoundingClientRect()
              setDropIdx(e.clientY > r.top + r.height / 2 ? i + 1 : i)
            }}
            onDrop={() => editor.canEdit && drop(dropIdx ?? i)}
            onClick={() => editor.setActiveSlide(s.id)}
          >
            <div className="well__thumb">
              <SlideView
                slide={s}
                deck={deck}
                width={148}
                onComponentData={(component) =>
                  rememberSlideComponent(s.id, component)
                }
                onComponentRemove={(id) => forgetSlideComponent(s.id, id)}
              />
            </div>
            <span className="well__badge">{i + 1}</span>
            {editor.canEdit && (
              <button
                className="well__del"
                title="Delete slide"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSlide(s, i)
                }}
              >
                ×
              </button>
            )}
          </div>
        </Fragment>
      ))}
      {inserter(slides.length)}
      {editor.canEdit && (
        <button
          className="well__add"
          onClick={addSlide}
          onDragOver={(e) => {
            if (!dragId) return
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
