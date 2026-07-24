// A contextual precision depth inside the single editor. The document column remains the primary
// editor; this shell temporarily composes its resident slide well, focused canvas, and selection
// inspector without introducing route/search state or another editor mode.

import { useCallback, useState } from 'react'
import { useEditor } from './EditorState'
import { PrecisionSlidePanel } from './PrecisionSlidePanel'
import { SlideWell } from './SlideWell'
import { Stage } from './Stage'
import type { DeckRoot, SlideDetail } from './deckDetail'

export interface PrecisionWorkspaceProps {
  slides: SlideDetail[]
  activeSlide: SlideDetail
  deck: DeckRoot | null
  onActivateSlide: (id: string) => void
}

export function PrecisionWorkspace({
  slides,
  activeSlide,
  deck,
  onActivateSlide,
}: PrecisionWorkspaceProps) {
  const editor = useEditor()
  const [inspectorHost, setInspectorHost] = useState<HTMLElement | null>(null)
  const inspectorHostRef = useCallback(
    (node: HTMLElement | null) => setInspectorHost(node),
    [],
  )

  return (
    <div className="precision-workspace">
      <aside className="precision-workspace__well" aria-label="Slides">
        <SlideWell
          slides={slides}
          deck={deck}
          onActivateSlide={onActivateSlide}
        />
      </aside>

      <div className="precision-workspace__stage">
        <Stage slide={activeSlide} deck={deck} inspectorHost={inspectorHost} />
      </div>

      <aside
        ref={inspectorHostRef}
        className="precision-workspace__inspector"
        aria-label="Properties"
      >
        <PrecisionSlidePanel slide={activeSlide} deck={deck} />
      </aside>

      {editor.selected.size === 0 && (
        <p className="precision-workspace__hint">
          Select an object to refine it · drag to move · Shift locks axis
        </p>
      )}
    </div>
  )
}
