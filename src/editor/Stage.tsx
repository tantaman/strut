// The operating table (spec §5.2): renders the active slide at 1280×720, auto-scaled to fit, with
// on-canvas component manipulation — move (single + multi, shift=20px snap), resize (SE handle,
// aspect-locked unless shift), rotate (shift=22.5° snap), delete, double-click text editing, and
// marquee selection. High-frequency drags use Rindle's `.folded` (debounced last-value-wins) writes.

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as RPointerEvent,
} from 'react'
import { GRID_SNAP, ROTATE_SNAP, SLIDE_H, SLIDE_W } from '../config'
import { useMutate } from '../rindle/RindleProvider'
import { useEditor } from './EditorState'
import { useSlideComponents } from './useSlideComponents'
import { cmpStyle, componentSize, renderInner } from './render'
import { backgroundImage, resolveBackground, type AnyComponent } from './types'

interface SlideRow {
  id: string
  background: string
  surface: string
}
interface DeckRow {
  background: string
  surface: string
}

function useFitScale(ref: React.RefObject<HTMLElement | null>, w: number, h: number, pad = 56) {
  const [scale, setScale] = useState(0.5)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setScale(Math.max(0.1, Math.min((r.width - pad) / w, (r.height - pad) / h)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, w, h, pad])
  return scale
}

export function Stage({ slide, deck }: { slide: SlideRow; deck: DeckRow | null }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const scale = useFitScale(stageRef, SLIDE_W, SLIDE_H)
  const components = useSlideComponents(slide.id)
  const mutate = useMutate()
  const editor = useEditor()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [marquee, setMarquee] = useState<null | { x: number; y: number; w: number; h: number }>(null)

  const bg = resolveBackground(slide.background, deck?.background)
  const bgImg = backgroundImage(slide.background, deck?.background)

  // Delete key removes selected components (spec §11), unless typing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      if (editor.selected.size === 0) return
      e.preventDefault()
      components
        .filter((c) => editor.selected.has(c.id))
        .forEach((c) => mutate.removeComponent({ table: c.table, id: c.id }))
      editor.clearSelection()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [components, editor, mutate])

  function raise(c: AnyComponent) {
    const maxZ = components.reduce((m, x) => Math.max(m, x.z_order), 0)
    if (c.z_order < maxZ) mutate.setComponentZ({ table: c.table, id: c.id, z_order: maxZ + 1 })
  }

  // ---- gestures ----
  function dragListen(move: (ev: PointerEvent) => void) {
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function beginMove(c: AnyComponent, e: RPointerEvent) {
    if (editingId === c.id) return
    e.stopPropagation()
    const additive = e.shiftKey || e.metaKey || e.ctrlKey
    if (additive) editor.select(c.id, true)
    else if (!editor.isSelected(c.id)) editor.select(c.id, false)
    raise(c)

    const ids = editor.isSelected(c.id) && editor.selected.size > 0 ? [...editor.selected] : [c.id]
    const starts = new Map(
      components.filter((x) => ids.includes(x.id)).map((x) => [x.id, { x: x.x, y: x.y, table: x.table }]),
    )
    const sx = e.clientX
    const sy = e.clientY
    dragListen((ev) => {
      const dx = (ev.clientX - sx) / scale
      const dy = (ev.clientY - sy) / scale
      starts.forEach((s, id) => {
        let nx = s.x + dx
        let ny = s.y + dy
        if (ev.shiftKey) {
          nx = Math.round(nx / GRID_SNAP) * GRID_SNAP
          ny = Math.round(ny / GRID_SNAP) * GRID_SNAP
        }
        mutate.moveComponent.folded({ key: id }, { table: s.table, id, x: Math.round(nx), y: Math.round(ny) })
      })
    })
  }

  function beginResize(c: AnyComponent, e: RPointerEvent) {
    e.stopPropagation()
    const sx = e.clientX
    const sy = e.clientY
    if (c.kind === 'text') {
      const startSize = c.size ?? 72
      dragListen((ev) => {
        const ns = Math.max(8, Math.round(startSize + (ev.clientY - sy) / scale))
        mutate.setText.folded(
          { key: c.id },
          { id: c.id, text: c.text ?? '', size: ns, color: c.color ?? '111111', font_family: c.font_family ?? 'Lato' },
        )
      })
      return
    }
    const { w, h } = componentSize(c)
    const ratio = h / w
    dragListen((ev) => {
      const nw = Math.max(20, Math.round(w + (ev.clientX - sx) / scale))
      const nh = ev.shiftKey ? Math.max(20, Math.round(h + (ev.clientY - sy) / scale)) : Math.round(nw * ratio)
      mutate.transformComponent.folded(
        { key: c.id },
        { table: c.table, id: c.id, scale_x: 1, scale_y: 1, scale_w: nw, scale_h: nh, rotate: c.rotate, skew_x: c.skew_x, skew_y: c.skew_y },
      )
    })
  }

  function beginRotate(c: AnyComponent, e: RPointerEvent) {
    e.stopPropagation()
    const el = stageRef.current?.querySelector(`.cmp[data-id="${c.id}"]`)
    if (!el) return
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const start = Math.atan2(e.clientY - cy, e.clientX - cx)
    const startRot = c.rotate
    dragListen((ev) => {
      let a = Math.atan2(ev.clientY - cy, ev.clientX - cx) - start + startRot
      if (ev.shiftKey) a = Math.round(a / ROTATE_SNAP) * ROTATE_SNAP
      mutate.transformComponent.folded(
        { key: c.id },
        { table: c.table, id: c.id, scale_x: 1, scale_y: 1, scale_w: c.scale_w, scale_h: c.scale_h, rotate: a, skew_x: c.skew_x, skew_y: c.skew_y },
      )
    })
  }

  function commitText(c: AnyComponent, html: string) {
    setEditingId(null)
    const plain = html.replace(/<[^>]*>/g, '').trim()
    if (plain.length === 0) mutate.removeComponent({ table: c.table, id: c.id })
    else mutate.setText({ id: c.id, text: html, size: c.size ?? 72, color: c.color ?? '111111', font_family: c.font_family ?? 'Lato' })
  }

  // ---- marquee on empty canvas ----
  function beginMarquee(e: RPointerEvent) {
    if (e.target !== e.currentTarget) return // only when clicking bare canvas
    const sx = e.clientX
    const sy = e.clientY
    let moved = false
    const move = (ev: PointerEvent) => {
      moved = true
      setMarquee({
        x: Math.min(sx, ev.clientX),
        y: Math.min(sy, ev.clientY),
        w: Math.abs(ev.clientX - sx),
        h: Math.abs(ev.clientY - sy),
      })
    }
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setMarquee(null)
      if (!moved) {
        editor.clearSelection()
        return
      }
      const box = { left: Math.min(sx, ev.clientX), top: Math.min(sy, ev.clientY), right: Math.max(sx, ev.clientX), bottom: Math.max(sy, ev.clientY) }
      const hit: string[] = []
      stageRef.current?.querySelectorAll<HTMLElement>('.cmp[data-id]').forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.left < box.right && r.right > box.left && r.top < box.bottom && r.bottom > box.top)
          hit.push(el.dataset.id!)
      })
      editor.selectMany(hit)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div className="stage" ref={stageRef}>
      <div className="slide-surface" style={{ width: SLIDE_W * scale, height: SLIDE_H * scale }}>
        <div
          className="slide-canvas"
          onPointerDown={beginMarquee}
          style={{
            width: SLIDE_W,
            height: SLIDE_H,
            transform: `scale(${scale})`,
            background: bg,
            backgroundImage: bgImg,
            backgroundSize: 'cover',
          }}
        >
          {components.map((c) => (
            <ComponentView
              key={c.id}
              c={c}
              scale={scale}
              selected={editor.isSelected(c.id)}
              soleSelected={editor.selected.size <= 1 && editor.isSelected(c.id)}
              editing={editingId === c.id}
              onPointerDownBody={(e) => beginMove(c, e)}
              onResize={(e) => beginResize(c, e)}
              onRotate={(e) => beginRotate(c, e)}
              onDelete={() => mutate.removeComponent({ table: c.table, id: c.id })}
              onStartEdit={() => c.kind === 'text' && setEditingId(c.id)}
              onCommitEdit={(html) => commitText(c, html)}
            />
          ))}
        </div>
      </div>
      {marquee && (
        <div
          className="marquee"
          style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h, position: 'fixed' }}
        />
      )}
    </div>
  )
}

function ComponentView({
  c,
  scale,
  selected,
  soleSelected,
  editing,
  onPointerDownBody,
  onResize,
  onRotate,
  onDelete,
  onStartEdit,
  onCommitEdit,
}: {
  c: AnyComponent
  scale: number
  selected: boolean
  soleSelected: boolean
  editing: boolean
  onPointerDownBody: (e: RPointerEvent) => void
  onResize: (e: RPointerEvent) => void
  onRotate: (e: RPointerEvent) => void
  onDelete: () => void
  onStartEdit: () => void
  onCommitEdit: (html: string) => void
}) {
  const counter = { transform: `translate(-50%, -50%) scale(${1 / scale})` }
  return (
    <div
      className={`cmp cmp--${c.kind}${selected ? ' is-selected' : ''}`}
      data-id={c.id}
      style={cmpStyle(c)}
      onPointerDown={onPointerDownBody}
      onDoubleClick={onStartEdit}
    >
      {editing && c.kind === 'text' ? <TextEditor c={c} onCommit={onCommitEdit} /> : renderInner(c)}
      {selected && (
        <button className="handle__del" style={counter} onPointerDown={(e) => e.stopPropagation()} onClick={onDelete}>
          ×
        </button>
      )}
      {soleSelected && !editing && (
        <>
          <div className="handle handle--se" style={counter} onPointerDown={onResize} />
          <div className="handle handle--rotate" style={counter} onPointerDown={onRotate} />
        </>
      )}
    </div>
  )
}

function TextEditor({ c, onCommit }: { c: AnyComponent; onCommit: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = c.text && c.text.length ? c.text : ''
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div
      ref={ref}
      className="cmp__textbody"
      contentEditable
      suppressContentEditableWarning
      onPointerDown={(e) => e.stopPropagation()}
      onBlur={() => onCommit(ref.current?.innerHTML ?? '')}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          ref.current?.blur()
        }
      }}
    />
  )
}
