// The overview / transition editor (spec §7): all slides as draggable 3-D cards positioned at their
// (x,y) center, tilted by rotateX/Y/Z, scaled by impScale. The number badge is the camera order.
//   • Drag a card to set x,y (folded). Shift/⌘-click or shift-drag a marquee to multi-select; dragging
//     any selected card moves the whole group as a unit.
//   • The selected card carries inline transform chips on its edges (rotY top, rotX left, rotZ right,
//     z + scale bottom) — degrees↔radians at the edge.
//   • Drag empty canvas to pan, scroll/⌘-scroll to zoom, Fit to frame everything.

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

const stop = (e: React.PointerEvent) => e.stopPropagation()

interface View {
  x: number
  y: number
  scale: number
}

interface Marquee {
  x: number
  y: number
  w: number
  h: number
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
  const [marquee, setMarquee] = useState<Marquee | null>(null)
  // Overview-local multi-selection (the editor's `selected` set is for components, not slides).
  const [selIds, setSelIds] = useState<Set<string>>(
    () => new Set(editor.activeSlideId ? [editor.activeSlideId] : []),
  )

  const soleId = selIds.size === 1 ? [...selIds][0] : null
  const soleSlide = soleId ? (slides.find((s) => s.id === soleId) ?? null) : null

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

  // Empty-canvas pointer down: shift = marquee select, otherwise pan.
  function beginBg(e: React.PointerEvent) {
    if (e.button !== 0) return
    if (e.shiftKey) beginMarquee(e)
    else beginPan(e)
  }

  function beginPan(e: React.PointerEvent) {
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

  // Rubber-band select: pick every slide whose center falls inside the dragged screen rect.
  function beginMarquee(e: React.PointerEvent) {
    const el = stageRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const ox = e.clientX - rect.left
    const oy = e.clientY - rect.top
    const v = view
    setMarquee({ x: ox, y: oy, w: 0, h: 0 })
    const move = (ev: PointerEvent) => {
      const cx = ev.clientX - rect.left
      const cy = ev.clientY - rect.top
      const x = Math.min(ox, cx)
      const y = Math.min(oy, cy)
      const w = Math.abs(cx - ox)
      const h = Math.abs(cy - oy)
      setMarquee({ x, y, w, h })
      const hit = slides.filter((s) => {
        const px = v.x + s.x * v.scale
        const py = v.y + s.y * v.scale
        return px >= x && px <= x + w && py >= y && py <= y + h
      })
      setSelIds(new Set(hit.map((s) => s.id)))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setMarquee(null)
      setSelIds((prev) => {
        if (prev.size) editor.setActiveSlide([...prev][0])
        return prev
      })
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

  // Card pointer down: resolve selection, then (if editable) drag the whole selection as a unit.
  function beginCard(s: OverviewSlide, e: React.PointerEvent) {
    e.stopPropagation()
    const additive = e.shiftKey || e.metaKey || e.ctrlKey
    if (additive) {
      setSelIds((prev) => {
        const next = new Set(prev)
        next.has(s.id) ? next.delete(s.id) : next.add(s.id)
        return next
      })
      editor.setActiveSlide(s.id)
      return // modifier-click only toggles membership; no drag
    }

    // Plain click on a member of a multi-selection keeps the group (so you can drag it);
    // otherwise it becomes the sole selection.
    const group = selIds.has(s.id) && selIds.size > 1
    if (!group) {
      setSelIds(new Set([s.id]))
      editor.setActiveSlide(s.id)
    }
    if (!editor.canEdit) return

    const ids = group ? [...selIds] : [s.id]
    const starts = ids
      .map((id) => slides.find((x) => x.id === id))
      .filter((m): m is OverviewSlide => !!m)
      .map((m) => ({ m, x0: m.x, y0: m.y }))

    const sx = e.clientX
    const sy = e.clientY
    const scale = view.scale || 1
    let moved = false
    let finals = new Map<string, { x: number; y: number }>()
    const move = (ev: PointerEvent) => {
      let dx = (ev.clientX - sx) / scale
      let dy = (ev.clientY - sy) / scale
      if (ev.shiftKey) {
        dx = Math.round(dx / GRID_SNAP) * GRID_SNAP
        dy = Math.round(dy / GRID_SNAP) * GRID_SNAP
      }
      if (dx !== 0 || dy !== 0) moved = true
      finals = new Map()
      for (const { m, x0, y0 } of starts) {
        const pos = { x: Math.round(x0 + dx), y: Math.round(y0 + dy) }
        finals.set(m.id, pos)
        setTransform(m, pos, true)
      }
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      if (!moved) return
      const fin = finals
      history.push({
        label: starts.length > 1 ? 'Move slides' : 'Move slide',
        redo: () => starts.forEach(({ m }) => setTransform(m, fin.get(m.id)!)),
        undo: () =>
          starts.forEach(({ m, x0, y0 }) => setTransform(m, { x: x0, y: y0 })),
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

  const inv = 1 / (view.scale || 1)

  return (
    <div
      className={'overview' + (panning ? ' is-panning' : '')}
      ref={stageRef}
      onPointerDown={beginBg}
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
              'ov-card' +
              (selIds.has(s.id) ? ' is-selected' : '') +
              (soleId === s.id ? ' is-active' : '')
            }
            style={{
              left: s.x,
              top: s.y,
              width: CARD_W,
              height: CARD_H,
              transform: `translate(-50%, -50%) perspective(900px) rotateX(${s.rotate_x}rad) rotateY(${s.rotate_y}rad) rotateZ(${s.rotate_z}rad) scale(${(s.imp_scale || 3) / 3})`,
              zIndex: selIds.has(s.id) ? 10 : 1,
            }}
            onPointerDown={(e) => beginCard(s, e)}
          >
            <span className="ov-card__num">{i + 1}</span>
            <div className="well__thumb">
              <SlideThumb slide={s} deck={deck} width={CARD_W} />
            </div>
          </div>
        ))}

        {editor.canEdit && soleSlide && (
          <SlideXform
            s={soleSlide}
            inv={inv}
            onChange={(patch) => setTransform(soleSlide, patch)}
          />
        )}
      </div>

      {marquee && (
        <div
          className="ov-marquee"
          style={{
            left: marquee.x,
            top: marquee.y,
            width: marquee.w,
            height: marquee.h,
          }}
        />
      )}

      <div className="ov-hint">
        {editor.canEdit
          ? 'Drag cards to arrange · shift-click / shift-drag to multi-select · drag canvas to pan · scroll to zoom'
          : 'Drag the canvas to pan · scroll to zoom · the number is the slide order'}
      </div>

      <div className="ov-controls" onPointerDown={stop}>
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
        <div className="ov-transitions" onPointerDown={stop}>
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
    </div>
  )
}

// Inline transform controls mounted on the selected card's edges (spec §7.1). The frame is flat
// (no 3-D) and sized to the card footprint; each chip counter-scales by `inv` to stay readable at
// any zoom. Rotations edit in degrees (converted to radians at the edge).
function SlideXform({
  s,
  inv,
  onChange,
}: {
  s: OverviewSlide
  inv: number
  onChange: (patch: Partial<OverviewSlide>) => void
}) {
  const sf = (s.imp_scale || 3) / 3
  return (
    <div
      className="ov-xform"
      style={{
        left: s.x,
        top: s.y,
        width: CARD_W * sf,
        height: CARD_H * sf,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="ov-xform__a ov-xform__a--top">
        <Chip
          label="⟲Y"
          inv={inv}
          value={Math.round(s.rotate_y * DEG)}
          onChange={(v) => onChange({ rotate_y: v / DEG })}
        />
      </div>
      <div className="ov-xform__a ov-xform__a--left">
        <Chip
          label="⟲X"
          inv={inv}
          value={Math.round(s.rotate_x * DEG)}
          onChange={(v) => onChange({ rotate_x: v / DEG })}
        />
      </div>
      <div className="ov-xform__a ov-xform__a--right">
        <Chip
          label="⟲Z"
          inv={inv}
          value={Math.round(s.rotate_z * DEG)}
          onChange={(v) => onChange({ rotate_z: v / DEG })}
        />
      </div>
      <div className="ov-xform__a ov-xform__a--bot">
        <div
          className="ov-xform__chip"
          style={{ transform: `scale(${inv})` }}
          onPointerDown={stop}
        >
          <span className="ov-xform__lbl">z</span>
          <input
            className="ov-xform__in"
            type="number"
            value={Math.round(s.z)}
            onChange={(e) => onChange({ z: Number(e.target.value) })}
          />
          <span className="ov-xform__lbl" title="Scale (impress)">
            ⤢
          </span>
          <input
            className="ov-xform__in"
            type="number"
            step={0.1}
            value={Math.round((s.imp_scale ?? 3) * 100) / 100}
            onChange={(e) => onChange({ imp_scale: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  )
}

function Chip({
  label,
  inv,
  value,
  step = 1,
  onChange,
}: {
  label: string
  inv: number
  value: number
  step?: number
  onChange: (v: number) => void
}) {
  return (
    <div
      className="ov-xform__chip"
      style={{ transform: `scale(${inv})` }}
      onPointerDown={stop}
    >
      <span className="ov-xform__lbl">{label}</span>
      <input
        className="ov-xform__in"
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
