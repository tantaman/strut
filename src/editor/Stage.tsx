// The operating table (spec §5.2): renders the active slide at 1280×720, auto-scaled to fit, with
// on-canvas component manipulation — move (single + multi, shift=20px snap), resize (SE handle,
// aspect-locked unless shift), rotate (shift=22.5° snap), delete, double-click text editing, and
// marquee selection. High-frequency drags use Rindle's `.folded` (debounced last-value-wins) writes.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as RPointerEvent } from 'react'
import {
  GRID_SNAP,
  newId,
  ROTATE_SNAP,
  SKEW_BASE,
  SKEW_SNAP,
  SLIDE_H,
  SLIDE_W,
} from '../config'
import { useMutate } from '../rindle/RindleProvider'
import { useEditor } from './EditorState'
import { useHistory } from './UndoProvider'
import { reinsertComponent } from './componentOps'
import {
  cmpStyle,
  componentSize,
  MarkdownSurface,
  renderInner,
  themeVars,
} from './render'
import {
  backgroundImage,
  composeBackground,
  resolveBackground,
  resolveSurface,
  SHAPES,
  textTypeOf,
} from './types'
import type { AnyComponent, DeckThemeFields } from './types'
import type { SlideDetail } from './deckDetail'
import { Inspector } from './Inspector'
import { RichTextToolbar } from './RichTextToolbar'
import { TipTapSlideEditor } from './TipTapSlideEditor'
import { LockedObjects } from './ObjectsLayer'
import { isDocEmpty } from './tiptapDoc'
import { useFitScale } from './useFitScale'
import { UserStyle } from './CssEditor'
import {
  ComponentDataReader,
  componentRefKey,
  mergeComponentRefs,
} from './componentFragments'

interface DeckRow extends DeckThemeFields {
  background: string
  surface: string
  custom_stylesheet?: string
}

// A single click (no real drag) with the shape tool armed drops this size, centered on the pointer —
// matches the renderer's default shape box (render.tsx DEFAULT_W/H['shape']). The 6px slop below is
// how far the pointer may move and still count as a "click" rather than a size-defining drag.
const SHAPE_DEFAULT = 200
const DRAW_SLOP = 6

export function Stage({
  slide,
  deck,
}: {
  slide: SlideDetail
  deck: DeckRow | null
}) {
  const slideData = slide
  const componentRefs = useMemo(
    () => mergeComponentRefs(slideData),
    [slideData],
  )
  const componentDataRef = useRef(new Map<string, AnyComponent>())
  const lastSlideIdRef = useRef(slideData.id)
  if (lastSlideIdRef.current !== slideData.id) {
    componentDataRef.current.clear()
    lastSlideIdRef.current = slideData.id
  }
  const rememberComponent = useCallback((component: AnyComponent) => {
    componentDataRef.current.set(component.id, component)
  }, [])
  const forgetComponent = useCallback((id: string) => {
    componentDataRef.current.delete(id)
  }, [])
  const getComponents = useCallback(
    () =>
      [...componentDataRef.current.values()].sort(
        (a, b) => a.z_order - b.z_order,
      ),
    [],
  )
  const stageRef = useRef<HTMLDivElement>(null)
  const scale = useFitScale(stageRef, SLIDE_W, SLIDE_H)
  // Markdown mode measures the preview area (which excludes the editor panel) so the slide fits the
  // space actually available to it. Both fit hooks run every render to keep hook order stable.
  const mdPreviewRef = useRef<HTMLDivElement>(null)
  const mdScale = useFitScale(mdPreviewRef, SLIDE_W, SLIDE_H)
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
  // Live preview box (slide coords) while sweeping out a shape with the armed shape tool.
  const [shapeDraft, setShapeDraft] = useState<null | {
    x: number
    y: number
    w: number
    h: number
  }>(null)

  const bg = resolveBackground(slideData.background, deck?.background)
  const bgImg = backgroundImage(slideData.background, deck?.background)
  const surf = resolveSurface(slideData.surface, deck?.surface)
  const surfImg = backgroundImage(slideData.surface, deck?.surface)

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
      const victims = getComponents().filter((c) => editor.selected.has(c.id))
      deleteComponents(victims)
      editor.clearSelection()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editor, getComponents, mutate])

  // Esc disarms the shape tool (back to Select), mirroring tldraw/Figma.
  useEffect(() => {
    if (!editor.pendingShape) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') editor.setPendingShape(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editor])

  // Remove component(s) as one undoable step (undo reinserts them with full geometry).
  function deleteComponents(victims: AnyComponent[]) {
    if (victims.length === 0) return
    const snapshots = victims.map((c) => ({ ...c }))
    history.batch(
      victims.length > 1 ? 'Delete components' : 'Delete component',
      () => {
        for (const c of snapshots) {
          mutate.removeComponent({ id: c.id })
          history.push({
            label: 'Delete component',
            redo: () => mutate.removeComponent({ id: c.id }),
            undo: () => reinsertComponent(mutate, c),
          })
        }
      },
    )
  }

  function raise(c: AnyComponent) {
    const maxZ = getComponents().reduce((m, x) => Math.max(m, x.z_order), 0)
    if (c.z_order < maxZ) mutate.setComponentZ({ id: c.id, z_order: maxZ + 1 })
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
    // Shape tool armed: don't select/move — let the pointer-down bubble to the canvas so drawing a new
    // shape works even when it starts over an existing object (Figma behavior).
    if (editor.pendingShape) return
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
      getComponents()
        .filter((x) => ids.includes(x.id))
        .map((x) => [x.id, { x: x.x, y: x.y }]),
    )
    const finals = new Map<string, { x: number; y: number }>()
    const sx = e.clientX
    const sy = e.clientY
    editor.setDraggingComponentId(c.id)
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
          const pos = { x: Math.round(nx), y: Math.round(ny) }
          finals.set(id, pos)
          mutate.moveComponent.folded({ key: id }, { id, x: pos.x, y: pos.y })
        })
      },
      () => {
        editor.setDraggingComponentId(null)
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
              mutate.moveComponent({ id, x: f.x, y: f.y }),
            ),
          undo: () =>
            moved.forEach(([id]) => {
              const s = starts.get(id)!
              mutate.moveComponent({ id, x: s.x, y: s.y })
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
      // '' color/font = theme-inherited — must survive the blob rewrite untouched.
      const color = c.color ?? ''
      const font = c.font_family ?? ''
      const textType = textTypeOf(c)
      editor.setDraggingComponentId(c.id)
      dragListen(
        (ev) => {
          lastSize = Math.max(
            8,
            Math.round(startSize + (ev.clientY - sy) / scale),
          )
          mutate.setText.folded(
            { key: c.id },
            {
              id: c.id,
              text,
              size: lastSize,
              color,
              font_family: font,
              text_type: textType,
            },
          )
        },
        () => {
          editor.setDraggingComponentId(null)
          if (lastSize === startSize) return
          const applySize = (size: number) =>
            mutate.setText({
              id: c.id,
              text,
              size,
              color,
              font_family: font,
              text_type: textType,
            })
          history.push({
            label: 'Resize text',
            redo: () => applySize(lastSize),
            undo: () => applySize(startSize),
          })
        },
      )
      return
    }
    const { w, h } = componentSize(c)
    const ratio = h / w
    const before = { scale_w: c.scale_w, scale_h: c.scale_h }
    let last = { scale_w: c.scale_w, scale_h: c.scale_h }
    editor.setDraggingComponentId(c.id)
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
        editor.setDraggingComponentId(null)
        if (last.scale_w === before.scale_w && last.scale_h === before.scale_h)
          return
        const apply = (s: { scale_w: number; scale_h: number }) =>
          mutate.transformComponent({
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
    editor.setDraggingComponentId(c.id)
    dragListen(
      (ev) => {
        let a = Math.atan2(ev.clientY - cy, ev.clientX - cx) - start + startRot
        if (ev.shiftKey) a = Math.round(a / ROTATE_SNAP) * ROTATE_SNAP
        lastRot = a
        mutate.transformComponent.folded(
          { key: c.id },
          {
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
        editor.setDraggingComponentId(null)
        if (lastRot === startRot) return
        const apply = (rot: number) =>
          mutate.transformComponent({
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

  function beginSkew(c: AnyComponent, e: RPointerEvent, axis: 'x' | 'y') {
    if (!editor.canEdit) return
    e.stopPropagation()
    const sx = e.clientX
    const sy = e.clientY
    const start = { skew_x: c.skew_x, skew_y: c.skew_y }
    let last = { ...start }
    editor.setDraggingComponentId(c.id)
    dragListen(
      (ev) => {
        // Shear grows with pointer travel; atan2 against a fixed baseline caps near ±90°
        // so the control can't produce a degenerate (near-flat) skew.
        const drag =
          axis === 'x' ? (ev.clientX - sx) / scale : (ev.clientY - sy) / scale
        let a = (axis === 'x' ? start.skew_x : start.skew_y) +
          Math.atan2(drag, SKEW_BASE)
        if (ev.shiftKey) a = Math.round(a / SKEW_SNAP) * SKEW_SNAP
        last =
          axis === 'x'
            ? { skew_x: a, skew_y: start.skew_y }
            : { skew_x: start.skew_x, skew_y: a }
        mutate.transformComponent.folded(
          { key: c.id },
          {
            id: c.id,
            scale_x: 1,
            scale_y: 1,
            scale_w: c.scale_w,
            scale_h: c.scale_h,
            rotate: c.rotate,
            skew_x: last.skew_x,
            skew_y: last.skew_y,
          },
        )
      },
      () => {
        editor.setDraggingComponentId(null)
        if (last.skew_x === start.skew_x && last.skew_y === start.skew_y) return
        const apply = (s: { skew_x: number; skew_y: number }) =>
          mutate.transformComponent({
            id: c.id,
            scale_x: 1,
            scale_y: 1,
            scale_w: c.scale_w,
            scale_h: c.scale_h,
            rotate: c.rotate,
            skew_x: s.skew_x,
            skew_y: s.skew_y,
          })
        history.push({
          label: 'Skew',
          redo: () => apply(last),
          undo: () => apply(start),
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
    // '' color/font = theme-inherited — must survive the blob rewrite untouched.
    const color = c.color ?? ''
    const font = c.font_family ?? ''
    const textType = textTypeOf(c)
    const apply = (text: string) =>
      mutate.setText({
        id: c.id,
        text,
        size,
        color,
        font_family: font,
        text_type: textType,
      })
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

  // ---- draw-to-place a shape (tldraw/Figma) ----
  // Insert a shape at an explicit box as ONE undoable step. addShape resets the spatial base to the
  // default 200×200, so a follow-up transform stamps the drawn size — the same insert-then-transform
  // the reinsert/import path uses (componentOps.insertComponent).
  function insertShape(
    name: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    const id = newId()
    const addArgs = {
      id,
      slideId: slideData.id,
      x,
      y,
      z_order: Math.floor(Date.now() / 1000),
      shape: name,
      markup: SHAPES[name] ?? '',
      fill: '3498db',
    }
    const size = {
      id,
      scale_x: 1,
      scale_y: 1,
      scale_w: w,
      scale_h: h,
      rotate: 0,
      skew_x: 0,
      skew_y: 0,
    }
    const doAdd = () => {
      mutate.addShape(addArgs)
      mutate.transformComponent(size)
    }
    doAdd()
    editor.select(id)
    history.push({
      label: 'Add shape',
      redo: doAdd,
      undo: () => mutate.removeComponent({ id }),
    })
  }

  // Sweep out the new shape's bounding box (position + size in one gesture). Shift = 1:1 (perfect
  // square/circle), Alt = grow from the center. A plain click (no real drag) drops a default-sized
  // shape centered on the pointer. Reverts to Select after committing.
  function beginDrawShape(e: RPointerEvent) {
    if (!editor.canEdit) return
    const name = editor.pendingShape
    if (!name) return
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const ox = (e.clientX - rect.left) / scale
    const oy = (e.clientY - rect.top) / scale
    let box = { x: ox, y: oy, w: 0, h: 0 }
    let moved = false
    const move = (ev: PointerEvent) => {
      let dx = (ev.clientX - rect.left) / scale - ox
      let dy = (ev.clientY - rect.top) / scale - oy
      if (ev.shiftKey) {
        const m = Math.max(Math.abs(dx), Math.abs(dy))
        dx = (dx < 0 ? -1 : 1) * m
        dy = (dy < 0 ? -1 : 1) * m
      }
      let x: number, y: number, w: number, h: number
      if (ev.altKey) {
        w = Math.abs(dx) * 2
        h = Math.abs(dy) * 2
        x = ox - Math.abs(dx)
        y = oy - Math.abs(dy)
      } else {
        x = Math.min(ox, ox + dx)
        y = Math.min(oy, oy + dy)
        w = Math.abs(dx)
        h = Math.abs(dy)
      }
      if (Math.abs(dx) > DRAW_SLOP || Math.abs(dy) > DRAW_SLOP) moved = true
      box = { x, y, w, h }
      setShapeDraft(box)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setShapeDraft(null)
      let { x, y, w, h } = box
      if (!moved || w < 8 || h < 8) {
        w = SHAPE_DEFAULT
        h = SHAPE_DEFAULT
        x = ox - w / 2
        y = oy - h / 2
      }
      insertShape(
        name,
        Math.round(x),
        Math.round(y),
        Math.round(w),
        Math.round(h),
      )
      editor.setPendingShape(null) // one shape, then back to Select
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // Bare-canvas pointer-down: draw a shape when the shape tool is armed, else marquee-select.
  function onCanvasPointerDown(e: RPointerEvent) {
    if (editor.pendingShape) beginDrawShape(e)
    else beginMarquee(e)
  }

  // Body-edit layer: the markdown doc is the editable surface (WYSIWYG, scaled to fit) with the
  // slide's Objects composited on top but locked. All the spatial hooks above still run — only the
  // rendered output branches — so hook order stays stable when the active slide flips layers.
  if (slideData.render_mode === 'markdown') {
    return (
      <div
        className="stage stage--md"
        ref={stageRef}
        style={{ background: composeBackground(surf, surfImg) }}
      >
        <UserStyle css={deck?.custom_stylesheet} />
        {editor.canEdit ? (
          // WYSIWYG: edit the TipTap doc in place on the slide surface (owns its own fit scale); the
          // locked Objects overlay rides along on top so you place body text in the real layout.
          <TipTapSlideEditor key={slideData.id} slide={slideData} deck={deck}>
            <LockedObjects slide={slideData} />
          </TipTapSlideEditor>
        ) : (
          // Viewer (no edit rights): the read-only body surface + the (locked) objects on top.
          <div className="md-preview" ref={mdPreviewRef}>
            <div
              className="slide-surface"
              style={{ width: SLIDE_W * mdScale, height: SLIDE_H * mdScale }}
            >
              <div
                className="slide-canvas strut-surface"
                style={{
                  width: SLIDE_W,
                  height: SLIDE_H,
                  transform: `scale(${mdScale})`,
                  background: composeBackground(bg, bgImg),
                  ...themeVars(deck, slideData),
                }}
              >
                <MarkdownSurface doc={slideData.doc} />
                <LockedObjects slide={slideData} />
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="stage"
      ref={stageRef}
      style={{ background: composeBackground(surf, surfImg) }}
    >
      <UserStyle css={deck?.custom_stylesheet} />
      <Inspector
        componentRefs={componentRefs}
        getComponents={getComponents}
        deck={deck}
      />
      <div
        className="slide-surface"
        style={{ width: SLIDE_W * scale, height: SLIDE_H * scale }}
      >
        <div
          className={`slide-canvas strut-surface${
            editor.pendingShape ? ' is-placing' : ''
          }`}
          onPointerDown={onCanvasPointerDown}
          style={{
            width: SLIDE_W,
            height: SLIDE_H,
            transform: `scale(${scale})`,
            background: composeBackground(bg, bgImg),
            ...themeVars(deck, slideData),
          }}
        >
          {/* Body underlay: the markdown doc, shown behind the editable objects but inert (its layer
              is pointer-events:none) so marquee/canvas clicks pass through. Skipped when empty, so a
              pure-objects slide is unchanged. */}
          {!isDocEmpty(slideData.doc) && (
            <div className="slide-locked-layer">
              <MarkdownSurface doc={slideData.doc} />
            </div>
          )}
          {componentRefs.map((component) => (
            <ComponentDataReader
              key={componentRefKey(component)}
              component={component}
              onData={rememberComponent}
              onRemove={forgetComponent}
            >
              {(c) => (
                <ComponentView
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
                  onSkew={(e, axis) => beginSkew(c, e, axis)}
                  onDelete={() => deleteComponents([c])}
                  onStartEdit={() =>
                    c.kind === 'text' && editor.canEdit && setEditingId(c.id)
                  }
                  onCommitEdit={(html) => commitText(c, html)}
                />
              )}
            </ComponentDataReader>
          ))}
          {shapeDraft && editor.pendingShape && (
            <div
              className="shape-draft"
              style={{
                left: shapeDraft.x,
                top: shapeDraft.y,
                width: shapeDraft.w,
                height: shapeDraft.h,
                color: '#3498db',
              }}
              dangerouslySetInnerHTML={{
                __html: SHAPES[editor.pendingShape] ?? '',
              }}
            />
          )}
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
  onSkew,
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
  onSkew: (e: RPointerEvent, axis: 'x' | 'y') => void
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
          <div
            className="handle handle--skewx"
            style={counter}
            onPointerDown={(e) => onSkew(e, 'x')}
          />
          <div
            className="handle handle--skewy"
            style={counter}
            onPointerDown={(e) => onSkew(e, 'y')}
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

// (The per-slide Objects/Body edit-layer toggle now lives in the deck Header top bar; markdown-mode
// editing lives in TipTapSlideEditor — WYSIWYG on the slide surface.)
