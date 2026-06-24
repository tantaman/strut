// The slide well (spec §5.1): live thumbnails, click to make active, ctrl/shift-click to multi-select,
// drag to reorder (fractional index), × to delete, + to add a blank slide.

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { newId, OVERVIEW_CARD_GAP } from '../config'
import { keyAfter, keyBetween } from '../lib/order'
import { useMutate } from '../rindle/RindleProvider'
import { useEditor } from './EditorState'
import { SlideThumb } from './SlideThumb'

export interface SlideRow {
  id: string
  deck_id: string
  sort: string
  x: number
  y: number
  background: string
  surface: string
}

export function SlideWell({ slides, deck }: { slides: SlideRow[]; deck: { background: string } | null }) {
  const editor = useEditor()
  const mutate = useMutate()
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropIdx, setDropIdx] = useState<number | null>(null)

  function addSlide() {
    const last = slides[slides.length - 1]
    const id = newId()
    mutate.addSlide({
      id,
      deckId: editor.deckId,
      sort: keyAfter(last?.sort),
      x: slides.length * OVERVIEW_CARD_GAP,
      y: 0,
      now: Date.now(),
    })
    editor.setActiveSlide(id)
  }

  function deleteSlide(s: SlideRow, idx: number) {
    // Component rows cascade authoritatively on the server (by slide_id); the client just drops the
    // slide row optimistically. See RINDLE_NOTES.md (cascade).
    mutate.deleteSlide({ id: s.id, textIds: [], imageIds: [], shapeIds: [], videoIds: [], webframeIds: [] })
    if (editor.activeSlideId === s.id) {
      const neighbor = slides[idx + 1] ?? slides[idx - 1] ?? null
      editor.setActiveSlide(neighbor?.id ?? null)
    }
  }

  function drop(targetIdx: number) {
    if (!dragId) return
    const without = slides.filter((s) => s.id !== dragId)
    const before = without[targetIdx - 1]
    const after = without[targetIdx]
    mutate.reorderSlide({ id: dragId, sort: keyBetween(before?.sort, after?.sort) })
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
          draggable
          onDragStart={() => setDragId(s.id)}
          onDragOver={(e) => {
            e.preventDefault()
            setDropIdx(i)
          }}
          onDrop={() => drop(i)}
          onClick={() => editor.setActiveSlide(s.id)}
        >
          <div className="well__thumb">
            <SlideThumb slide={s} deck={deck} width={148} />
          </div>
          <span className="well__badge">{i + 1}</span>
          <button
            className="well__del"
            onClick={(e) => {
              e.stopPropagation()
              deleteSlide(s, i)
            }}
          >
            ×
          </button>
        </div>
      ))}
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
    </div>
  )
}
