// The overview / transition editor (spec §7): all slides as draggable 3-D cards positioned at their
// (x,y) center, tilted by rotateX/Y/Z, scaled by impScale. The number badge is the camera order.
// Drag sets x,y (folded); a panel edits z / impScale / rotation (degrees↔radians at the edge).

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { GRID_SNAP } from '../config'
import { useMutate } from '../rindle/RindleProvider'
import { useEditor } from './EditorState'
import { useHistory } from './UndoProvider'
import { CANNED_TRANSITIONS } from './transitions'
import { SlideThumb } from './SlideThumb'

export interface OverviewSlide {
  id: string
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

const CARD_W = 240
const CARD_H = (CARD_W * 9) / 16
const DEG = 180 / Math.PI

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v))

interface View {
  x: number
  y: number
  scale: number
}

export function Overview({
  slides,
  deck,
}: {
  slides: OverviewSlide[]
  deck: { id: string; background: string; canned_transition: string } | null
}) {
  const editor = useEditor()
  const mutate = useMutate()
  const history = useHistory()
  const stageRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>({ x: 0, y: 0, scale: 1 })
  const [panning, setPanning] = useState(false)

  const active = slides.find((s) => s.id === editor.activeSlideId) ?? null

  // Frame all slide cards (centers ± card extents) into the viewport. Cards are positioned
  // at world (x,y); the world transform is `translate(x,y) scale(s)` about origin 0,0, so a
  // world point w maps to screen `view.{x,y} + s*w`. Pick s + offset to center the bbox.
  function fit() {
    const el = stageRef.current
    if (!el || slides.length === 0) return
    const cw = el.clientWidth
    const ch = el.clientHeight
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const s of slides) {
      minX = Math.min(minX, s.x)
      maxX = Math.max(maxX, s.x)
      minY = Math.min(minY, s.y)
      maxY = Math.max(maxY, s.y)
    }
    minX -= CARD_W / 2
    maxX += CARD_W / 2
    minY -= CARD_H / 2
    maxY += CARD_H / 2
    const pad = 80
    const scale = clamp(
      Math.min((cw - 2 * pad) / (maxX - minX), (ch - 2 * pad) / (maxY - minY)),
      0.1,
      1,
    )
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    setView({ scale, x: cw / 2 - scale * cx, y: ch / 2 - scale * cy })
  }

  // Re-frame whenever the set of slides changes (mount, add, remove) — but NOT on drags,
  // which only move existing ids. Keyed on the id list so position edits don't snap the view.
  const idsKey = slides.map((s) => s.id).join(',')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(fit, [idsKey])

  // Zoom around a world point under the cursor (keeps that point fixed on screen).
  function zoomAt(cx: number, cy: number, factor: number) {
    setView((v) => {
      const scale = clamp(v.scale * factor, 0.1, 2)
      const wx = (cx - v.x) / v.scale
      const wy = (cy - v.y) / v.scale
      return { scale, x: cx - wx * scale, y: cy - wy * scale }
    })
  }
  function zoomBy(factor: number) {
    const el = stageRef.current
    if (!el) return
    zoomAt(el.clientWidth / 2, el.clientHeight / 2, factor)
  }

  // Trackpad / wheel: ctrl|meta = zoom, otherwise two-finger pan. Needs a non-passive
  // listener to preventDefault (React's onWheel is passive and can't).
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      if (e.ctrlKey || e.metaKey) {
        zoomAt(mx, my, Math.exp(-e.deltaY * 0.0015))
      } else {
        setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Drag on empty space pans the world (cards stopPropagation, so this only fires on the bg).
  function beginPan(e: React.PointerEvent) {
    if (e.button !== 0) return
    const sx = e.clientX
    const sy = e.clientY
    const v0 = view
    setPanning(true)
    const move = (ev: PointerEvent) =>
      setView({ ...v0, x: v0.x + (ev.clientX - sx), y: v0.y + (ev.clientY - sy) })
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setPanning(false)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function setTransform(
    s: OverviewSlide,
    patch: Partial<OverviewSlide>,
    folded = false,
  ) {
    const args = {
      id: s.id,
      x: patch.x ?? s.x,
      y: patch.y ?? s.y,
      z: patch.z ?? s.z,
      rotate_x: patch.rotate_x ?? s.rotate_x,
      rotate_y: patch.rotate_y ?? s.rotate_y,
      rotate_z: patch.rotate_z ?? s.rotate_z,
      imp_scale: patch.imp_scale ?? s.imp_scale,
      now: Date.now(),
    }
    if (folded) mutate.setSlideTransform.folded({ key: s.id }, args)
    else mutate.setSlideTransform(args)
  }

  function beginDrag(s: OverviewSlide, e: React.PointerEvent) {
    e.stopPropagation()
    editor.setActiveSlide(s.id)
    if (!editor.canEdit) return
    const sx = e.clientX
    const sy = e.clientY
    const x0 = s.x
    const y0 = s.y
    const scale = view.scale || 1
    let last = { x: x0, y: y0 }
    const move = (ev: PointerEvent) => {
      // Screen → world: a 1px screen move is 1/scale world units when zoomed.
      let nx = x0 + (ev.clientX - sx) / scale
      let ny = y0 + (ev.clientY - sy) / scale
      if (ev.shiftKey) {
        nx = Math.round(nx / GRID_SNAP) * GRID_SNAP
        ny = Math.round(ny / GRID_SNAP) * GRID_SNAP
      }
      last = { x: Math.round(nx), y: Math.round(ny) }
      setTransform(s, last, true)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      if (last.x === x0 && last.y === y0) return
      const finalPos = last
      history.push({
        label: 'Move slide',
        redo: () => setTransform(s, finalPos),
        undo: () => setTransform(s, { x: x0, y: y0 }),
      })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function setTransition(name: string) {
    if (!deck) return
    mutate.setDeckTheme({
      id: deck.id,
      canned_transition: name,
      now: Date.now(),
    })
  }

  return (
    <div
      className={'overview' + (panning ? ' is-panning' : '')}
      ref={stageRef}
      onPointerDown={beginPan}
    >
      <div
        className="overview__world"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
        }}
      >
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={
              'ov-card' + (editor.activeSlideId === s.id ? ' is-active' : '')
            }
            style={{
              left: s.x,
              top: s.y,
              width: CARD_W,
              height: (CARD_W * 9) / 16,
              transform: `translate(-50%, -50%) perspective(900px) rotateX(${s.rotate_x}rad) rotateY(${s.rotate_y}rad) rotateZ(${s.rotate_z}rad) scale(${(s.imp_scale || 3) / 3})`,
              zIndex: editor.activeSlideId === s.id ? 10 : 1,
            }}
            onPointerDown={(e) => beginDrag(s, e)}
          >
            <span className="ov-card__num">{i + 1}</span>
            <div className="well__thumb">
              <SlideThumb slide={s} deck={deck} width={CARD_W} />
            </div>
          </div>
        ))}
      </div>

      <div className="ov-hint">
        {editor.canEdit
          ? 'Drag cards to arrange the camera path · drag the canvas to pan · scroll/⌘-scroll to zoom'
          : 'Drag the canvas to pan · scroll to zoom · the number is the slide order'}
      </div>

      <div className="ov-controls" onPointerDown={(e) => e.stopPropagation()}>
        <button className="ov-ctl" onClick={() => zoomBy(1 / 1.2)} title="Zoom out">
          −
        </button>
        <span className="ov-ctl__pct">{Math.round(view.scale * 100)}%</span>
        <button className="ov-ctl" onClick={() => zoomBy(1.2)} title="Zoom in">
          +
        </button>
        <button className="ov-ctl ov-ctl--fit" onClick={fit} title="Fit all slides">
          Fit
        </button>
      </div>

      {editor.canEdit && (
        <div
          className="ov-transitions"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span className="ov-transitions__label">Transition</span>
          {CANNED_TRANSITIONS.map((name) => (
            <button
              key={name}
              className={
                'ov-transitions__btn' +
                ((deck?.canned_transition ?? 'none') === name
                  ? ' is-active'
                  : '')
              }
              onClick={() => setTransition(name)}
              title={`Camera transition: ${name}`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {active && editor.canEdit && (
        <div
          className="popover"
          style={{ top: 12, right: 12, width: 180 }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <strong style={{ fontSize: 12 }}>Slide transform</strong>
          <NumRow
            label="z"
            value={Math.round(active.z)}
            onChange={(v) => setTransform(active, { z: v })}
          />
          <NumRow
            label="scale"
            value={Math.round((active.imp_scale ?? 3) * 100) / 100}
            step={0.1}
            onChange={(v) => setTransform(active, { imp_scale: v })}
          />
          <NumRow
            label="rotX°"
            value={Math.round(active.rotate_x * DEG)}
            onChange={(v) => setTransform(active, { rotate_x: v / DEG })}
          />
          <NumRow
            label="rotY°"
            value={Math.round(active.rotate_y * DEG)}
            onChange={(v) => setTransform(active, { rotate_y: v / DEG })}
          />
          <NumRow
            label="rotZ°"
            value={Math.round(active.rotate_z * DEG)}
            onChange={(v) => setTransform(active, { rotate_z: v / DEG })}
          />
        </div>
      )}
    </div>
  )
}

function NumRow({
  label,
  value,
  step = 1,
  onChange,
}: {
  label: string
  value: number
  step?: number
  onChange: (v: number) => void
}) {
  return (
    <label
      className="field"
      style={{ justifyContent: 'space-between', marginTop: 6 }}
    >
      {label}
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}
