// A quiet card-corner layout affordance for the primary text component. Presets materialize directly
// into its component geometry, so doc-first, precision, Present and export keep one source of truth.

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SLIDE_H, SLIDE_W } from '../config'
import { useMutate } from '../rindle/RindleProvider'
import { useHistory } from './UndoProvider'
import {
  componentGeometry,
  DOC_TEXT_LAYOUTS,
  docTextLayoutForGeometry,
  geometryForDocTextLayout,
} from './docTextLayouts'
import type { ComponentGeometry, DocTextLayoutId } from './docTextLayouts'
import type { AnyComponent } from './types'

const POPOVER_GAP = 6
const VIEWPORT_MARGIN = 8

function applyGeometry(
  mutate: ReturnType<typeof useMutate>,
  geometry: ComponentGeometry,
): void {
  mutate.moveComponent({
    id: geometry.id,
    x: geometry.x,
    y: geometry.y,
  })
  mutate.transformComponent({
    id: geometry.id,
    scale_x: geometry.scale_x,
    scale_y: geometry.scale_y,
    scale_w: geometry.scale_w,
    scale_h: geometry.scale_h,
    rotate: geometry.rotate,
    skew_x: geometry.skew_x,
    skew_y: geometry.skew_y,
  })
}

function LayoutGlyph({
  frame,
}: {
  frame: { x: number; y: number; w: number; h: number }
}) {
  return (
    <span className="doc-layout__glyph" aria-hidden="true">
      <i
        style={{
          left: `${(frame.x / SLIDE_W) * 100}%`,
          top: `${(frame.y / SLIDE_H) * 100}%`,
          width: `${(frame.w / SLIDE_W) * 100}%`,
          height: `${(frame.h / SLIDE_H) * 100}%`,
        }}
      />
    </span>
  )
}

export function DocTextLayoutPicker({
  component,
}: {
  component: AnyComponent
}) {
  const mutate = useMutate()
  const history = useHistory()
  const currentGeometry = componentGeometry(component)
  const current = docTextLayoutForGeometry(currentGeometry)
  const currentLayout = DOC_TEXT_LAYOUTS.find((layout) => layout.id === current)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{
    top: number
    left: number
  } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const firstChoiceRef = useRef<HTMLButtonElement>(null)
  const activeChoiceRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef(false)

  const close = (restoreFocus = false) => {
    restoreFocusRef.current = restoreFocus
    setOpen(false)
  }

  const commit = (layoutId: DocTextLayoutId) => {
    close(true)
    const before = componentGeometry(component)
    const after = geometryForDocTextLayout(component, layoutId)
    if (docTextLayoutForGeometry(before) === layoutId) return
    applyGeometry(mutate, after)
    history.push({
      label: 'Change text layout',
      redo: () => applyGeometry(mutate, after),
      undo: () => applyGeometry(mutate, before),
    })
  }

  const place = () => {
    const anchor = buttonRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const width = panelRef.current?.offsetWidth ?? 176
    const height = panelRef.current?.offsetHeight ?? 178
    let left = rect.left
    if (left + width + VIEWPORT_MARGIN > window.innerWidth)
      left = window.innerWidth - width - VIEWPORT_MARGIN
    left = Math.max(VIEWPORT_MARGIN, left)
    let top = rect.bottom + POPOVER_GAP
    if (
      top + height + VIEWPORT_MARGIN > window.innerHeight &&
      rect.top - height - POPOVER_GAP > VIEWPORT_MARGIN
    )
      top = rect.top - height - POPOVER_GAP
    setPosition({ top: Math.max(VIEWPORT_MARGIN, top), left })
  }

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null)
      if (restoreFocusRef.current) {
        restoreFocusRef.current = false
        buttonRef.current?.focus()
      }
      return
    }
    place()
    const frame = window.requestAnimationFrame(() => {
      place()
      const choice = activeChoiceRef.current ?? firstChoiceRef.current
      choice?.focus()
    })
    const onMove = () => place()
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
    }
  }, [open, current])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      )
        return
      close()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      close(true)
    }
    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open])

  const buttonFrame = currentLayout?.frame ?? {
    x: Math.max(0, Math.min(SLIDE_W, currentGeometry.x)),
    y: Math.max(0, Math.min(SLIDE_H, currentGeometry.y)),
    w: Math.max(
      1,
      Math.min(currentGeometry.scale_w, SLIDE_W - currentGeometry.x),
    ),
    h: Math.max(
      1,
      Math.min(currentGeometry.scale_h, SLIDE_H - currentGeometry.y),
    ),
  }
  const title = `Text layout: ${currentLayout?.label ?? 'Custom'}`

  return (
    <div className="doc-layout" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`doc-layout__button${open ? ' is-open' : ''}`}
        title={title}
        aria-label={title}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          restoreFocusRef.current = false
          setOpen((value) => !value)
        }}
      >
        <LayoutGlyph frame={buttonFrame} />
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            className="popover doc-layout__popover"
            role="dialog"
            aria-label="Text layout"
            style={{
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              visibility: position ? 'visible' : 'hidden',
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {DOC_TEXT_LAYOUTS.map((layout) => (
              <button
                key={layout.id}
                ref={(node) => {
                  if (layout.id === DOC_TEXT_LAYOUTS[0].id)
                    firstChoiceRef.current = node
                  if (layout.id === current) activeChoiceRef.current = node
                }}
                type="button"
                className={`doc-layout__choice${layout.id === current ? ' is-active' : ''}`}
                aria-pressed={layout.id === current}
                title={layout.label}
                onClick={() => commit(layout.id)}
              >
                <LayoutGlyph frame={layout.frame} />
                <span>{layout.label}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
