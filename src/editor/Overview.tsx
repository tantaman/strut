// The overview / transition editor (spec §7): all slides as draggable 3-D cards positioned at their
// (x,y) center, tilted by rotateX/Y/Z, scaled by impScale. The number badge is the camera order.
// Drag sets x,y (folded); a panel edits z / impScale / rotation (degrees↔radians at the edge).

import { useRef } from 'react'
import { GRID_SNAP } from '../config'
import { useMutate } from '../rindle/RindleProvider'
import { useEditor } from './EditorState'
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
const DEG = 180 / Math.PI

export function Overview({ slides, deck }: { slides: OverviewSlide[]; deck: { background: string } | null }) {
  const editor = useEditor()
  const mutate = useMutate()
  const worldRef = useRef<HTMLDivElement>(null)

  const active = slides.find((s) => s.id === editor.activeSlideId) ?? null

  function setTransform(s: OverviewSlide, patch: Partial<OverviewSlide>, folded = false) {
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
    const sx = e.clientX
    const sy = e.clientY
    const x0 = s.x
    const y0 = s.y
    const move = (ev: PointerEvent) => {
      let nx = x0 + (ev.clientX - sx)
      let ny = y0 + (ev.clientY - sy)
      if (ev.shiftKey) {
        nx = Math.round(nx / GRID_SNAP) * GRID_SNAP
        ny = Math.round(ny / GRID_SNAP) * GRID_SNAP
      }
      setTransform(s, { x: Math.round(nx), y: Math.round(ny) }, true)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div className="overview">
      <div className="overview__world" ref={worldRef} style={{ width: 6000, height: 4000 }}>
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={'ov-card' + (editor.activeSlideId === s.id ? ' is-active' : '')}
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

      <div className="ov-hint">Drag cards to arrange the camera path · the number is the slide order</div>

      {active && (
        <div className="popover" style={{ top: 12, right: 12, width: 180 }}>
          <strong style={{ fontSize: 12 }}>Slide transform</strong>
          <NumRow label="z" value={Math.round(active.z)} onChange={(v) => setTransform(active, { z: v })} />
          <NumRow label="scale" value={Math.round((active.imp_scale ?? 3) * 100) / 100} step={0.1} onChange={(v) => setTransform(active, { imp_scale: v })} />
          <NumRow label="rotX°" value={Math.round(active.rotate_x * DEG)} onChange={(v) => setTransform(active, { rotate_x: v / DEG })} />
          <NumRow label="rotY°" value={Math.round(active.rotate_y * DEG)} onChange={(v) => setTransform(active, { rotate_y: v / DEG })} />
          <NumRow label="rotZ°" value={Math.round(active.rotate_z * DEG)} onChange={(v) => setTransform(active, { rotate_z: v / DEG })} />
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
    <label className="field" style={{ justifyContent: 'space-between', marginTop: 6 }}>
      {label}
      <input type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}
