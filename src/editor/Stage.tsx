// The operating table (spec §5.2): renders the active slide at 1280×720, auto-scaled to fit, with
// on-canvas component manipulation — move (single + multi, shift=20px snap), resize (SE handle,
// aspect-locked unless shift), rotate (shift=22.5° snap), delete, double-click text editing, and
// marquee selection. High-frequency drags use Rindle's `.folded` (debounced last-value-wins) writes.

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as RPointerEvent,
} from 'react'
import { useFragment } from '@rindle/react'
import { SlideFragment } from '../../shared/fragments'
import { GRID_SNAP, ROTATE_SNAP, SLIDE_H, SLIDE_W } from '../config'
import { useMutate } from '../rindle/RindleProvider'
import { useEditor } from './EditorState'
import { useHistory } from './UndoProvider'
import { reinsertComponent } from './componentOps'
import { cmpStyle, componentSize, renderInner } from './render'
import {
  backgroundImage,
  mergeComponents,
  resolveBackground,
  resolveSurface,
  type AnyComponent,
} from './types'
import type { DeckDetailSlide } from './deckDetail'
import { Inspector } from './Inspector'
import { RichTextToolbar } from './RichTextToolbar'
import { UserStyle } from './CssEditor'

interface DeckRow {
  background: string
  surface: string
  custom_stylesheet?: string
}

function useFitScale(
  ref: React.RefObject<HTMLElement | null>,
  w: number,
  h: number,
  pad = 56,
) {
  const [scale, setScale] = useState(0.5)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setScale(
        Math.max(0.1, Math.min((r.width - pad) / w, (r.height - pad) / h)),
      )
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, w, h, pad])
  return scale
}

export function Stage({
  slide,
  deck,
}: {
  slide: DeckDetailSlide
  deck: DeckRow | null
}) {
  // Read the slide through the fragment (unmasking the five component arrays the composed deck query
  // already materialized), then `mergeComponents` flattens them into the single z-ordered
  // AnyComponent[] the editor's cross-type interaction (select / marquee / z-order / inspector)
  // operates on. This is the SAME data path <SlideView> uses for read-only thumbnails — the Stage
  // just additionally wraps each component with selection + resize handles.
  const s = useFragment(SlideFragment, slide)
  const components = useMemo(
    () => mergeComponents(s.texts, s.images, s.shapes, s.videos, s.webframes),
    [s],
  )
  const stageRef = useRef<HTMLDivElement>(null)
  const scale = useFitScale(stageRef, SLIDE_W, SLIDE_H)
  const mutate = useMutate()
  const editor = useEditor()
  const history = useHistory()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [marquee, setMarquee] = useState<null | {
    x: number
    y: number
    w: number
    h: number
  }>(null)

  const bg = resolveBackground(s.background, deck?.background)
  const bgImg = backgroundImage(s.background, deck?.background)
  const surf = resolveSurface(s.surface, deck?.surface)
  const surfImg = backgroundImage(s.surface, deck?.surface)

  // Delete key removes selected components (spec §11), unless typing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!editor.canEdit) return
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      const t = e.target as HTMLElement | null
      if (
        t &&
        (t.isContentEditable ||
          t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA')
      )
        return
      if (editor.selected.size === 0) return
      e.preventDefault()
      const victims = components.filter((c) => editor.selected.has(c.id))
      deleteComponents(victims)
      editor.clearSelection()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [components, editor, mutate])

  // Remove component(s) as one undoable step (undo reinserts them with full geometry).
  function deleteComponents(victims: AnyComponent[]) {
    if (victims.length === 0) return
    const snapshots = victims.map((c) => ({ ...c }))
    history.batch(
      victims.length > 1 ? 'Delete components' : 'Delete component',
      () => {
        for (const c of snapshots) {
          mutate.removeComponent({ table: c.table, id: c.id })
          history.push({
            label: 'Delete component',
            redo: () => mutate.removeComponent({ table: c.table, id: c.id }),
            undo: () => reinsertComponent(mutate, c),
          })
        }
      },
    )
  }

  function raise(c: AnyComponent) {
    const maxZ = components.reduce((m, x) => Math.max(m, x.z_order), 0)
    if (c.z_order < maxZ)
      mutate.setComponentZ({ table: c.table, id: c.id, z_order: maxZ + 1 })
  }

  // ---- gestures ----
  function dragListen(move: (ev: PointerEvent) => void, end?: () => void) {
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      end?.()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function beginMove(c: AnyComponent, e: RPointerEvent) {
    if (editingId === c.id || !editor.canEdit) return
    e.stopPropagation()
    const additive = e.shiftKey || e.metaKey || e.ctrlKey
    if (additive) editor.select(c.id, true)
    else if (!editor.isSelected(c.id)) editor.select(c.id, false)
    raise(c)

    const ids =
      editor.isSelected(c.id) && editor.selected.size > 0
        ? [...editor.selected]
        : [c.id]
    const starts = new Map(
      components
        .filter((x) => ids.includes(x.id))
        .map((x) => [x.id, { x: x.x, y: x.y, table: x.table }]),
    )
    const finals = new Map<
      string,
      { x: number; y: number; table: AnyComponent['table'] }
    >()
    const sx = e.clientX
    const sy = e.clientY
    dragListen(
      (ev) => {
        const dx = (ev.clientX - sx) / scale
        const dy = (ev.clientY - sy) / scale
        starts.forEach((s, id) => {
          let nx = s.x + dx
          let ny = s.y + dy
          if (ev.shiftKey) {
            nx = Math.round(nx / GRID_SNAP) * GRID_SNAP
            ny = Math.round(ny / GRID_SNAP) * GRID_SNAP
          }
          const pos = { x: Math.round(nx), y: Math.round(ny), table: s.table }
          finals.set(id, pos)
          mutate.moveComponent.folded(
            { key: id },
            { table: s.table, id, x: pos.x, y: pos.y },
          )
        })
      },
      () => {
        // One undoable step for the whole (possibly multi-) drag.
        const moved = [...finals].filter(([id, f]) => {
          const s = starts.get(id)!
          return s.x !== f.x || s.y !== f.y
        })
        if (moved.length === 0) return
        history.push({
          label: 'Move',
          redo: () =>
            moved.forEach(([id, f]) =>
              mutate.moveComponent({ table: f.table, id, x: f.x, y: f.y }),
            ),
          undo: () =>
            moved.forEach(([id]) => {
              const s = starts.get(id)!
              mutate.moveComponent({ table: s.table, id, x: s.x, y: s.y })
            }),
        })
      },
    )
  }

  function beginResize(c: AnyComponent, e: RPointerEvent) {
    if (!editor.canEdit) return
    e.stopPropagation()
    const sx = e.clientX
    const sy = e.clientY
    if (c.kind === 'text') {
      const startSize = c.size ?? 72
      let lastSize = startSize
      const text = c.text ?? ''
      const color = c.color ?? '111111'
      const font = c.font_family ?? 'Lato'
      dragListen(
        (ev) => {
          lastSize = Math.max(
            8,
            Math.round(startSize + (ev.clientY - sy) / scale),
          )
          mutate.setText.folded(
            { key: c.id },
            { id: c.id, text, size: lastSize, color, font_family: font },
          )
        },
        () => {
          if (lastSize === startSize) return
          history.push({
            label: 'Resize text',
            redo: () =>
              mutate.setText({
                id: c.id,
                text,
                size: lastSize,
                color,
                font_family: font,
              }),
            undo: () =>
              mutate.setText({
                id: c.id,
                text,
                size: startSize,
                color,
                font_family: font,
              }),
          })
        },
      )
      return
    }
    const { w, h } = componentSize(c)
    const ratio = h / w
    const before = { scale_w: c.scale_w, scale_h: c.scale_h }
    let last = { scale_w: c.scale_w, scale_h: c.scale_h }
    dragListen(
      (ev) => {
        const nw = Math.max(20, Math.round(w + (ev.clientX - sx) / scale))
        const nh = ev.shiftKey
          ? Math.max(20, Math.round(h + (ev.clientY - sy) / scale))
          : Math.round(nw * ratio)
        last = { scale_w: nw, scale_h: nh }
        mutate.transformComponent.folded(
          { key: c.id },
          {
            table: c.table,
            id: c.id,
            scale_x: 1,
            scale_y: 1,
            scale_w: nw,
            scale_h: nh,
            rotate: c.rotate,
            skew_x: c.skew_x,
            skew_y: c.skew_y,
          },
        )
      },
      () => {
        if (last.scale_w === before.scale_w && last.scale_h === before.scale_h)
          return
        const apply = (s: { scale_w: number; scale_h: number }) =>
          mutate.transformComponent({
            table: c.table,
            id: c.id,
            scale_x: 1,
            scale_y: 1,
            scale_w: s.scale_w,
            scale_h: s.scale_h,
            rotate: c.rotate,
            skew_x: c.skew_x,
            skew_y: c.skew_y,
          })
        history.push({
          label: 'Resize',
          redo: () => apply(last),
          undo: () => apply(before),
        })
      },
    )
  }

  function beginRotate(c: AnyComponent, e: RPointerEvent) {
    if (!editor.canEdit) return
    e.stopPropagation()
    const el = stageRef.current?.querySelector(`.cmp[data-id="${c.id}"]`)
    if (!el) return
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const start = Math.atan2(e.clientY - cy, e.clientX - cx)
    const startRot = c.rotate
    let lastRot = startRot
    dragListen(
      (ev) => {
        let a = Math.atan2(ev.clientY - cy, ev.clientX - cx) - start + startRot
        if (ev.shiftKey) a = Math.round(a / ROTATE_SNAP) * ROTATE_SNAP
        lastRot = a
        mutate.transformComponent.folded(
          { key: c.id },
          {
            table: c.table,
            id: c.id,
            scale_x: 1,
            scale_y: 1,
            scale_w: c.scale_w,
            scale_h: c.scale_h,
            rotate: a,
            skew_x: c.skew_x,
            skew_y: c.skew_y,
          },
        )
      },
      () => {
        if (lastRot === startRot) return
        const apply = (rot: number) =>
          mutate.transformComponent({
            table: c.table,
            id: c.id,
            scale_x: 1,
            scale_y: 1,
            scale_w: c.scale_w,
            scale_h: c.scale_h,
            rotate: rot,
            skew_x: c.skew_x,
            skew_y: c.skew_y,
          })
        history.push({
          label: 'Rotate',
          redo: () => apply(lastRot),
          undo: () => apply(startRot),
        })
      },
    )
  }

  function commitText(c: AnyComponent, html: string) {
    setEditingId(null)
    const plain = html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim()
    if (plain.length === 0) {
      deleteComponents([c]) // empty box is deleted (undoable — reinserts it)
      return
    }
    if (html === (c.text ?? '')) return // no change
    const before = c.text ?? ''
    const size = c.size ?? 72
    const color = c.color ?? '111111'
    const font = c.font_family ?? 'Lato'
    const apply = (text: string) =>
      mutate.setText({ id: c.id, text, size, color, font_family: font })
    apply(html)
    history.push({
      label: 'Edit text',
      redo: () => apply(html),
      undo: () => apply(before),
    })
  }

  // ---- marquee on empty canvas ----
  function beginMarquee(e: RPointerEvent) {
    if (!editor.canEdit) return
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
      const box = {
        left: Math.min(sx, ev.clientX),
        top: Math.min(sy, ev.clientY),
        right: Math.max(sx, ev.clientX),
        bottom: Math.max(sy, ev.clientY),
      }
      const hit: string[] = []
      stageRef.current
        ?.querySelectorAll<HTMLElement>('.cmp[data-id]')
        .forEach((el) => {
          const r = el.getBoundingClientRect()
          if (
            r.left < box.right &&
            r.right > box.left &&
            r.top < box.bottom &&
            r.bottom > box.top
          )
            hit.push(el.dataset.id!)
        })
      editor.selectMany(hit)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      className="stage"
      ref={stageRef}
      style={{
        background: surf,
        backgroundImage: surfImg,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <UserStyle css={deck?.custom_stylesheet} />
      <Inspector components={components} />
      <div
        className="slide-surface"
        style={{ width: SLIDE_W * scale, height: SLIDE_H * scale }}
      >
        <div
          className="slide-canvas strut-surface"
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
              canEdit={editor.canEdit}
              selected={editor.isSelected(c.id)}
              soleSelected={
                editor.selected.size <= 1 && editor.isSelected(c.id)
              }
              editing={editingId === c.id}
              onPointerDownBody={(e) => beginMove(c, e)}
              onResize={(e) => beginResize(c, e)}
              onRotate={(e) => beginRotate(c, e)}
              onDelete={() => deleteComponents([c])}
              onStartEdit={() =>
                c.kind === 'text' && editor.canEdit && setEditingId(c.id)
              }
              onCommitEdit={(html) => commitText(c, html)}
            />
          ))}
        </div>
      </div>
      {marquee && (
        <div
          className="marquee"
          style={{
            left: marquee.x,
            top: marquee.y,
            width: marquee.w,
            height: marquee.h,
            position: 'fixed',
          }}
        />
      )}
    </div>
  )
}

function ComponentView({
  c,
  scale,
  canEdit,
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
  canEdit: boolean
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
      {editing && c.kind === 'text' ? (
        <TextEditor c={c} scale={scale} onCommit={onCommitEdit} />
      ) : (
        renderInner(c)
      )}
      {selected && canEdit && (
        <button
          className="handle__del"
          style={counter}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onDelete}
        >
          ×
        </button>
      )}
      {soleSelected && !editing && canEdit && (
        <>
          <div
            className="handle handle--se"
            style={counter}
            onPointerDown={onResize}
          />
          <div
            className="handle handle--rotate"
            style={counter}
            onPointerDown={onRotate}
          />
        </>
      )}
    </div>
  )
}

function TextEditor({
  c,
  scale,
  onCommit,
}: {
  c: AnyComponent
  scale: number
  onCommit: (html: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = c.text && c.text.length ? c.text : ''
    el.focus()
    // Legacy tags (<b>/<i>/<font>) so text serializes the way the renderer reads it (spec §6.3).
    try {
      document.execCommand('styleWithCSS', false, 'false')
    } catch {
      /* not supported everywhere — harmless */
    }
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <>
      <RichTextToolbar scale={scale} />
      <div
        ref={ref}
        className="cmp__textbody"
        contentEditable
        suppressContentEditableWarning
        onPointerDown={(e) => e.stopPropagation()}
        onBlur={() => onCommit(ref.current?.innerHTML ?? '')}
        // Paste plain text only (spec §6.3).
        onPaste={(e) => {
          e.preventDefault()
          const text = e.clipboardData.getData('text/plain')
          document.execCommand('insertText', false, text)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            ref.current?.blur()
          }
        }}
      />
    </>
  )
}
