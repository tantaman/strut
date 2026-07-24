// The precision canvas: a 1280×720 slide with Bento-inspired direct manipulation (smart guides,
// eight-handle/group resize, group rotation, exact arrange commands, keyboard nudge/duplicate) adapted
// to Strut's optimistic Rindle rows. Every gesture is still one shared undo command.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as RPointerEvent } from 'react'
import { newId, ROTATE_SNAP, SLIDE_H, SLIDE_W } from '../config'
import { useMutate } from '../rindle/RindleProvider'
import { useEditor } from './EditorState'
import { useHistory } from './UndoProvider'
import { reinsertComponent, zNow } from './componentOps'
import {
  buildComponentClipboardPayload,
  COMPONENT_PASTE_OFFSET,
  componentClipboardKey,
  instantiateComponentClipboard,
  readComponentClipboardData,
  writeComponentClipboardData,
} from './componentClipboard'
import {
  BackgroundImageLayer,
  cmpStyle,
  componentSize,
  MarkdownBodies,
  renderInner,
  slideHasBody,
  themeVars,
} from './render'
import {
  backgroundImage,
  composeBackground,
  DEFAULT_SHAPE_FILL,
  isStrokeShape,
  resolveBackground,
  resolveBackgroundImage,
  resolveSurface,
  SHAPES,
  SHAPE_TOOLS,
  strokeGeometry,
  textTypeOf,
} from './types'
import type { AnyComponent, DeckThemeFields } from './types'
import type { SlideDetail } from './deckDetail'
import { Inspector } from './Inspector'
import type {
  PrecisionArrangeAction,
  PrecisionFramePatch,
  PrecisionInspectorActions,
} from './Inspector'
import { RichTextToolbar } from './RichTextToolbar'
import { useFitScale } from './useFitScale'
import { UserStyle } from './CssEditor'
import { componentClassName } from './componentClasses'
import {
  ComponentDataReader,
  componentRefKey,
  mergeComponentRefs,
} from './componentFragments'
import {
  alignFrames,
  distributeFrames,
  matchFrameSize,
  planZReorder,
  resizeGroupFrames,
  selectionBounds,
  snapMove,
} from './precisionGeometry'
import type {
  Alignment,
  PrecisionBounds,
  PrecisionFrame,
  ResizeHandle,
  SnapGuide,
  ZReorderAction,
} from './precisionGeometry'

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

function isEditableTarget(target: EventTarget | null): boolean {
  const t = target as HTMLElement | null
  return !!(
    t &&
    (t.isContentEditable ||
      t.tagName === 'INPUT' ||
      t.tagName === 'TEXTAREA' ||
      t.tagName === 'SELECT')
  )
}

export function Stage({
  slide,
  deck,
  inspectorHost,
}: {
  slide: SlideDetail
  deck: DeckRow | null
  inspectorHost?: HTMLElement | null
}) {
  const slideData = slide
  const editor = useEditor()
  const editorRef = useRef(editor)
  editorRef.current = editor
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
  const [, setComponentRevision] = useState(0)
  const rememberComponent = useCallback((component: AnyComponent) => {
    componentDataRef.current.set(component.id, component)
    // The component fragment renders below this parent. Bump the lightweight parent revision so the
    // combined selection frame/portal inspector can follow that independently-rendered live row.
    setComponentRevision((revision) => revision + 1)
  }, [])
  const forgetComponent = useCallback((id: string) => {
    componentDataRef.current.delete(id)
    // Fragment refs can briefly remount when the ordered component list changes. Defer stale-selection
    // cleanup until replacement readers have had a chance to publish the same id again.
    queueMicrotask(() => {
      if (componentDataRef.current.has(id)) return
      const currentEditor = editorRef.current
      if (currentEditor.selected.has(id)) {
        currentEditor.selectMany(
          [...currentEditor.selected].filter((selectedId) => selectedId !== id),
        )
      }
    })
    setComponentRevision((revision) => revision + 1)
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
  const mutate = useMutate()
  const history = useHistory()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [marquee, setMarquee] = useState<null | {
    x: number
    y: number
    w: number
    h: number
  }>(null)
  const [guides, setGuides] = useState<readonly SnapGuide[]>([])
  // Live preview (slide coords + baked markup) while drawing a shape with the armed shape tool.
  const [shapeDraft, setShapeDraft] = useState<null | {
    x: number
    y: number
    w: number
    h: number
    markup: string
  }>(null)
  const pasteStateRef = useRef({ key: '', count: 0 })

  const bg = resolveBackground(slideData.background, deck?.background)
  const bgImg = resolveBackgroundImage(slideData.background, deck?.background)
  const surf = resolveSurface(slideData.surface, deck?.surface)
  const surfImg = backgroundImage(slideData.surface, deck?.surface)

  type GeometrySnapshot = {
    id: string
    x: number
    y: number
    scale_x: number
    scale_y: number
    scale_w: number
    scale_h: number
    rotate: number
    skew_x: number
    skew_y: number
  }

  function frameForComponent(component: AnyComponent): PrecisionFrame {
    const fallback = componentSize(component)
    // Intrinsic legacy text has 0×0 in the row. offsetWidth/Height are unscaled, unrotated layout
    // dimensions, exactly what a first precision resize should materialize into the spatial columns.
    const node = [
      ...(stageRef.current?.querySelectorAll<HTMLElement>('.cmp[data-id]') ??
        []),
    ].find((candidate) => candidate.dataset.id === component.id)
    const w =
      component.scale_w ||
      node?.offsetWidth ||
      fallback.w ||
      Math.max(40, component.size ?? 72)
    const h =
      component.scale_h ||
      node?.offsetHeight ||
      fallback.h ||
      Math.max(20, component.size ?? 72)
    return {
      id: component.id,
      x: component.x,
      y: component.y,
      w,
      h,
      rotate: component.rotate,
    }
  }

  function geometryOf(component: AnyComponent): GeometrySnapshot {
    return {
      id: component.id,
      x: component.x,
      y: component.y,
      scale_x: component.scale_x,
      scale_y: component.scale_y,
      scale_w: component.scale_w,
      scale_h: component.scale_h,
      rotate: component.rotate,
      skew_x: component.skew_x,
      skew_y: component.skew_y,
    }
  }

  function geometryFromFrame(
    component: AnyComponent,
    frame: PrecisionFrame,
  ): GeometrySnapshot {
    return {
      ...geometryOf(component),
      x: frame.x,
      y: frame.y,
      // A frame always has measured dimensions. Persist them when a precision command changes size;
      // callers that only move retain the component's stored dimensions below.
      scale_w: frame.w,
      scale_h: frame.h,
      rotate: frame.rotate,
    }
  }

  function applyGeometry(
    snapshots: readonly GeometrySnapshot[],
    folded = false,
  ) {
    for (const value of snapshots) {
      const move = { id: value.id, x: value.x, y: value.y }
      const transform = {
        id: value.id,
        scale_x: value.scale_x,
        scale_y: value.scale_y,
        scale_w: value.scale_w,
        scale_h: value.scale_h,
        rotate: value.rotate,
        skew_x: value.skew_x,
        skew_y: value.skew_y,
      }
      if (folded) {
        mutate.moveComponent.folded({ key: value.id }, move)
        mutate.transformComponent.folded({ key: value.id }, transform)
      } else {
        mutate.moveComponent(move)
        mutate.transformComponent(transform)
      }
    }
  }

  function commitGeometry(
    label: string,
    components: readonly AnyComponent[],
    frames: readonly PrecisionFrame[],
    options: { persistSize?: boolean; alreadyApplied?: boolean } = {},
  ) {
    const frameById = new Map(frames.map((frame) => [frame.id, frame]))
    const before = components.map(geometryOf)
    const after = components.flatMap((component) => {
      const frame = frameById.get(component.id)
      if (!frame) return []
      const snapshot = geometryFromFrame(component, frame)
      if (!options.persistSize) {
        snapshot.scale_w = component.scale_w
        snapshot.scale_h = component.scale_h
      }
      return [snapshot]
    })
    if (after.length === 0) return
    const changed = after.some((value, index) => {
      const previous = before[index]
      return (
        value.x !== previous.x ||
        value.y !== previous.y ||
        value.scale_w !== previous.scale_w ||
        value.scale_h !== previous.scale_h ||
        value.rotate !== previous.rotate
      )
    })
    if (!changed) return
    if (!options.alreadyApplied) applyGeometry(after)
    history.push({
      label,
      redo: () => applyGeometry(after),
      undo: () => applyGeometry(before),
    })
  }

  function componentsFor(ids: Iterable<string>): AnyComponent[] {
    const wanted = new Set(ids)
    return getComponents().filter((component) => wanted.has(component.id))
  }

  // Selection insertion order matters for commands such as Match width/height, where the first
  // selected object is the reference. Paint-order sorting is still used everywhere else.
  function componentsInOrder(ids: Iterable<string>): AnyComponent[] {
    const byId = new Map(
      getComponents().map((component) => [component.id, component]),
    )
    return [...ids].flatMap((id) => {
      const component = byId.get(id)
      return component ? [component] : []
    })
  }

  function duplicateComponents(source: readonly AnyComponent[]) {
    if (!editor.canEdit || source.length === 0) return
    const current = getComponents()
    const maxZ = current.reduce(
      (value, component) => Math.max(value, component.z_order),
      0,
    )
    const copies = source.map((component, index) => ({
      ...component,
      id: newId(),
      x: component.x + COMPONENT_PASTE_OFFSET,
      y: component.y + COMPONENT_PASTE_OFFSET,
      z_order: maxZ + index + 1,
    }))
    for (const copy of copies) reinsertComponent(mutate, copy)
    editor.selectMany(copies.map((copy) => copy.id))
    history.push({
      label: copies.length > 1 ? 'Duplicate components' : 'Duplicate component',
      redo: () => copies.forEach((copy) => reinsertComponent(mutate, copy)),
      undo: () =>
        copies.forEach((copy) => mutate.removeComponent({ id: copy.id })),
    })
  }

  const nudgeBurstRef = useRef<null | {
    key: string
    before: GeometrySnapshot[]
    after: GeometrySnapshot[]
    timer: ReturnType<typeof setTimeout> | null
  }>(null)

  function flushNudge() {
    const burst = nudgeBurstRef.current
    if (!burst) return
    if (burst.timer) clearTimeout(burst.timer)
    nudgeBurstRef.current = null
    if (
      !burst.after.some((value, index) => {
        const before = burst.before[index]
        return value.x !== before.x || value.y !== before.y
      })
    )
      return
    history.push({
      label: burst.after.length > 1 ? 'Nudge components' : 'Nudge component',
      redo: () => applyGeometry(burst.after),
      undo: () => applyGeometry(burst.before),
    })
  }

  // Bento/Figma keyboard muscle memory: arrows nudge by one, Shift by ten, and Cmd/Ctrl+D duplicates.
  // A held arrow is one gesture, so its repeat burst collapses to a single undo after a short idle.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!editor.canEdit || isEditableTarget(event.target)) return
      const selected = componentsFor(editor.selected)
      if (selected.length === 0) return
      const mod = event.metaKey || event.ctrlKey
      if (mod && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        flushNudge()
        duplicateComponents(selected)
        return
      }
      if (
        event.key !== 'ArrowLeft' &&
        event.key !== 'ArrowRight' &&
        event.key !== 'ArrowUp' &&
        event.key !== 'ArrowDown'
      )
        return
      event.preventDefault()
      const step = event.shiftKey ? 10 : 1
      const dx =
        event.key === 'ArrowLeft'
          ? -step
          : event.key === 'ArrowRight'
            ? step
            : 0
      const dy =
        event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
      const key = selected
        .map((component) => component.id)
        .sort()
        .join(':')
      if (nudgeBurstRef.current?.key !== key) flushNudge()
      const burst = nudgeBurstRef.current ?? {
        key,
        before: selected.map(geometryOf),
        after: selected.map(geometryOf),
        timer: null,
      }
      burst.after = burst.after.map((value) => ({
        ...value,
        x: value.x + dx,
        y: value.y + dy,
      }))
      applyGeometry(burst.after)
      if (burst.timer) clearTimeout(burst.timer)
      burst.timer = setTimeout(flushNudge, 220)
      nudgeBurstRef.current = burst
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      flushNudge()
    }
  }, [editor.canEdit, editor.selected, history, mutate, slideData.id])

  // Delete key removes selected components (spec §11), unless typing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!editor.canEdit) return
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      if (isEditableTarget(e.target)) return
      if (editor.selected.size === 0) return
      e.preventDefault()
      const victims = getComponents().filter((c) => editor.selected.has(c.id))
      deleteComponents(victims)
      editor.clearSelection()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editor, getComponents, mutate])

  // Component clipboard: Cmd/Ctrl+C copies selected objects; Cmd/Ctrl+V pastes fresh copies onto the
  // active slide. The payload is app-specific JSON, while the paste operation itself goes through the
  // same reinsert path as undo/import so every component kind stays covered.
  useEffect(() => {
    function onCopy(e: ClipboardEvent) {
      if (isEditableTarget(e.target) || editor.selected.size === 0) return
      const selected = getComponents().filter((c) => editor.selected.has(c.id))
      const payload = buildComponentClipboardPayload(selected)
      if (!payload) return
      e.preventDefault()
      if (!e.clipboardData) return
      writeComponentClipboardData(e.clipboardData, payload)
      pasteStateRef.current = {
        key: componentClipboardKey(payload),
        count: 0,
      }
    }

    function onPaste(e: ClipboardEvent) {
      if (!editor.canEdit || isEditableTarget(e.target)) return
      const payload = readComponentClipboardData(e.clipboardData)
      if (!payload) return
      e.preventDefault()
      pasteComponents(payload)
    }

    window.addEventListener('copy', onCopy)
    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('copy', onCopy)
      window.removeEventListener('paste', onPaste)
    }
  }, [editor, getComponents, history, mutate, slideData.id])

  // Shape-tool keyboard shortcuts (Excalidraw parity): 1 or Esc = Select, 2–7 = arm a shape tool.
  // Guarded so digits typed into a field or the text editor don't hijack the canvas.
  useEffect(() => {
    if (!editor.canEdit) return
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Escape') {
        editor.setPendingShape(null)
        return
      }
      const t = e.target as HTMLElement | null
      if (
        t &&
        (t.isContentEditable ||
          t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.tagName === 'SELECT')
      )
        return
      if (e.key === '1') editor.setPendingShape(null)
      else if (e.key >= '2' && e.key <= '7') {
        // '2'..'7' → SHAPE_TOOLS[0..5]; the range guard keeps the index in-bounds.
        e.preventDefault()
        editor.setPendingShape(SHAPE_TOOLS[Number(e.key) - 2])
      }
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

  function pasteComponents(
    payload: NonNullable<ReturnType<typeof readComponentClipboardData>>,
  ) {
    const key = componentClipboardKey(payload)
    const count =
      pasteStateRef.current.key === key ? pasteStateRef.current.count + 1 : 1
    pasteStateRef.current = { key, count }

    const current = getComponents()
    const maxZ = current.reduce((m, c) => Math.max(m, c.z_order), zNow())
    const pasted = instantiateComponentClipboard(payload, {
      slideId: slideData.id,
      offset: COMPONENT_PASTE_OFFSET * count,
      zStart: maxZ + 1,
      newId,
    })
    if (pasted.length === 0) return

    history.batch(
      pasted.length > 1 ? 'Paste components' : 'Paste component',
      () => {
        for (const c of pasted) {
          reinsertComponent(mutate, c)
          history.push({
            label: 'Paste component',
            redo: () => reinsertComponent(mutate, c),
            undo: () => mutate.removeComponent({ id: c.id }),
          })
        }
      },
    )
    editor.selectMany(pasted.map((c) => c.id))
  }

  // ---- gestures ----
  function dragListen(move: (ev: PointerEvent) => void, end?: () => void) {
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      window.removeEventListener('blur', finish)
      end?.()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    window.addEventListener('blur', finish)
  }

  function deepSelect(event: RPointerEvent) {
    const canvas = stageRef.current?.querySelector<HTMLElement>('.slide-canvas')
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) / scale
    const y = (event.clientY - rect.top) / scale
    const candidates = getComponents()
      .filter((component) => {
        const frame = frameForComponent(component)
        return (
          x >= frame.x &&
          x <= frame.x + frame.w &&
          y >= frame.y &&
          y <= frame.y + frame.h
        )
      })
      .sort((a, b) => b.z_order - a.z_order)
    if (candidates.length === 0) return
    const current = editor.selected.size === 1 ? [...editor.selected][0] : null
    const currentIndex = current
      ? candidates.findIndex((component) => component.id === current)
      : -1
    const next = candidates[(currentIndex + 1) % candidates.length]
    editor.select(next.id)
  }

  function beginMove(c: AnyComponent, e: RPointerEvent) {
    if (editingId === c.id || !editor.canEdit) return
    // Shape tool armed: don't select/move — let the pointer-down bubble to the canvas so drawing a new
    // shape works even when it starts over an existing object (Figma behavior).
    if (editor.pendingShape) return
    e.stopPropagation()
    if (e.altKey) {
      deepSelect(e)
      return
    }
    // Cmd/Ctrl-click is an unambiguous toggle and never mutates geometry. Shift-click adds a new item;
    // Shift-drag on an existing selection remains available for Bento-style axis locking.
    if (e.metaKey || e.ctrlKey) {
      editor.select(c.id, true)
      return
    }
    const selectedIds = new Set(editor.selected)
    if (!selectedIds.has(c.id)) {
      if (e.shiftKey) selectedIds.add(c.id)
      else {
        selectedIds.clear()
        selectedIds.add(c.id)
      }
      editor.selectMany([...selectedIds])
    }
    const moving = componentsFor(selectedIds)
    const starts = moving.map(frameForComponent)
    const peers = getComponents().map(frameForComponent)
    let lastFrames = starts
    const sx = e.clientX
    const sy = e.clientY
    editor.setDraggingComponentId(c.id)
    dragListen(
      (ev) => {
        let dx = (ev.clientX - sx) / scale
        let dy = (ev.clientY - sy) / scale
        if (ev.shiftKey) {
          if (Math.abs(dx) >= Math.abs(dy)) dy = 0
          else dx = 0
        }
        const snapped = snapMove(starts, { x: dx, y: dy }, peers, {
          threshold: 6 / scale,
        })
        lastFrames = snapped.frames
        setGuides(snapped.guides)
        for (const frame of lastFrames) {
          mutate.moveComponent.folded(
            { key: frame.id },
            { id: frame.id, x: frame.x, y: frame.y },
          )
        }
      },
      () => {
        editor.setDraggingComponentId(null)
        setGuides([])
        commitGeometry(
          moving.length > 1 ? 'Move components' : 'Move',
          moving,
          lastFrames,
          {
            alreadyApplied: true,
          },
        )
      },
    )
  }

  function beginResize(
    components: readonly AnyComponent[],
    handle: ResizeHandle,
    event: RPointerEvent,
  ) {
    if (!editor.canEdit || components.length === 0) return
    event.preventDefault()
    event.stopPropagation()
    const starts = components.map(frameForComponent)
    let lastFrames = starts
    const sx = event.clientX
    const sy = event.clientY
    editor.setDraggingComponentId(components[0].id)
    dragListen(
      (moveEvent) => {
        const result = resizeGroupFrames(
          starts,
          handle,
          {
            x: (moveEvent.clientX - sx) / scale,
            y: (moveEvent.clientY - sy) / scale,
          },
          {
            aspectLock: moveEvent.shiftKey,
            center: moveEvent.altKey,
            minSize: 8,
          },
        )
        lastFrames = result.frames
        const byId = new Map(lastFrames.map((frame) => [frame.id, frame]))
        applyGeometry(
          components.flatMap((component) => {
            const frame = byId.get(component.id)
            return frame ? [geometryFromFrame(component, frame)] : []
          }),
          true,
        )
      },
      () => {
        editor.setDraggingComponentId(null)
        commitGeometry(
          components.length > 1 ? 'Resize components' : 'Resize',
          components,
          lastFrames,
          { persistSize: true, alreadyApplied: true },
        )
      },
    )
  }

  function beginRotate(
    components: readonly AnyComponent[],
    event: RPointerEvent,
  ) {
    if (!editor.canEdit || components.length === 0) return
    event.preventDefault()
    event.stopPropagation()
    const starts = components.map(frameForComponent)
    const bounds = selectionBounds(starts)
    const canvas = stageRef.current?.querySelector<HTMLElement>('.slide-canvas')
    if (!bounds || !canvas) return
    const canvasRect = canvas.getBoundingClientRect()
    const center = { x: bounds.centerX, y: bounds.middleY }
    const centerClient = {
      x: canvasRect.left + center.x * scale,
      y: canvasRect.top + center.y * scale,
    }
    const startAngle = Math.atan2(
      event.clientY - centerClient.y,
      event.clientX - centerClient.x,
    )
    let lastFrames = starts
    editor.setDraggingComponentId(components[0].id)
    dragListen(
      (moveEvent) => {
        let delta =
          Math.atan2(
            moveEvent.clientY - centerClient.y,
            moveEvent.clientX - centerClient.x,
          ) - startAngle
        if (moveEvent.shiftKey)
          delta = Math.round(delta / ROTATE_SNAP) * ROTATE_SNAP
        const cos = Math.cos(delta)
        const sin = Math.sin(delta)
        lastFrames = starts.map((frame) => {
          const frameCenter = {
            x: frame.x + frame.w / 2,
            y: frame.y + frame.h / 2,
          }
          const dx = frameCenter.x - center.x
          const dy = frameCenter.y - center.y
          const nextCenter = {
            x: center.x + dx * cos - dy * sin,
            y: center.y + dx * sin + dy * cos,
          }
          return {
            ...frame,
            x: nextCenter.x - frame.w / 2,
            y: nextCenter.y - frame.h / 2,
            rotate: frame.rotate + delta,
          }
        })
        const byId = new Map(lastFrames.map((frame) => [frame.id, frame]))
        applyGeometry(
          components.flatMap((component) => {
            const frame = byId.get(component.id)
            if (!frame) return []
            const snapshot = geometryFromFrame(component, frame)
            snapshot.scale_w = component.scale_w
            snapshot.scale_h = component.scale_h
            return [snapshot]
          }),
          true,
        )
      },
      () => {
        editor.setDraggingComponentId(null)
        commitGeometry(
          components.length > 1 ? 'Rotate components' : 'Rotate',
          components,
          lastFrames,
          { alreadyApplied: true },
        )
      },
    )
  }

  function setPrecisionFrame(
    id: string,
    patch: PrecisionFramePatch,
    label: string,
  ) {
    if (!editor.canEdit) return
    const component = getComponents().find((candidate) => candidate.id === id)
    if (!component) return
    const frame = { ...frameForComponent(component), ...patch, id }
    commitGeometry(label, [component], [frame], {
      persistSize: patch.w !== undefined || patch.h !== undefined,
    })
  }

  function arrangeComponents(
    ids: readonly string[],
    action: PrecisionArrangeAction,
  ) {
    if (!editor.canEdit) return
    const components = componentsInOrder(ids)
    const frames = components.map(frameForComponent)
    let arranged: PrecisionFrame[]
    let label: string
    let persistSize = false

    if (action === 'distribute-horizontal') {
      arranged = distributeFrames(frames, 'horizontal')
      label = 'Distribute horizontally'
    } else if (action === 'distribute-vertical') {
      arranged = distributeFrames(frames, 'vertical')
      label = 'Distribute vertically'
    } else if (action === 'match-width') {
      arranged = matchFrameSize(frames, 'width')
      label = 'Match widths'
      persistSize = true
    } else if (action === 'match-height') {
      arranged = matchFrameSize(frames, 'height')
      label = 'Match heights'
      persistSize = true
    } else {
      arranged = alignFrames(frames, action)
      label = `Align ${alignmentLabel(action)}`
    }

    commitGeometry(label, components, arranged, { persistSize })
  }

  function reorderComponents(ids: readonly string[], action: ZReorderAction) {
    if (!editor.canEdit) return
    const all = getComponents()
    const plan = planZReorder(
      all.map((component) => ({ id: component.id, z: component.z_order })),
      ids,
      action,
    )
    if (plan.moves.length === 0) return

    const before = plan.assignments.map(({ id, previousZ }) => ({
      id,
      z_order: previousZ,
    }))
    const after = plan.assignments.map(({ id, z }) => ({ id, z_order: z }))
    const apply = (values: readonly { id: string; z_order: number }[]) => {
      for (const value of values) mutate.setComponentZ(value)
    }
    apply(after)
    history.push({
      label:
        action === 'front'
          ? 'Bring to front'
          : action === 'forward'
            ? 'Bring forward'
            : action === 'backward'
              ? 'Send backward'
              : 'Send to back',
      redo: () => apply(after),
      undo: () => apply(before),
    })
  }

  const inspectorActions: PrecisionInspectorActions = {
    frameFor: frameForComponent,
    setFrame: setPrecisionFrame,
    duplicate: (ids) => duplicateComponents(componentsInOrder(ids)),
    delete: (ids) => {
      const components = componentsInOrder(ids)
      deleteComponents(components)
      editor.clearSelection()
    },
    arrange: arrangeComponents,
    reorder: reorderComponents,
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
    markup: string,
    fill: string,
  ) {
    const id = newId()
    const addArgs = {
      id,
      slideId: slideData.id,
      x,
      y,
      z_order: Math.floor(Date.now() / 1000),
      shape: name,
      markup,
      fill,
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
  function beginDrawBox(name: string, ox: number, oy: number, rect: DOMRect) {
    const markup = SHAPES[name] ?? ''
    const fill = DEFAULT_SHAPE_FILL
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
      setShapeDraft({ ...box, markup })
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
        markup,
        fill,
      )
      editor.setPendingShape(null) // one shape, then back to Select
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // Draw a stroke shape (line / arrow / freehand). Line & arrow are the segment from press to release
  // (Shift snaps the angle to 45°); freehand accumulates the pointer path. A plain click drops a short
  // default line/arrow; a click with the draw tool is a no-op. Reverts to Select after committing.
  function beginDrawStroke(
    name: string,
    ox: number,
    oy: number,
    rect: DOMRect,
  ) {
    const fill = DEFAULT_SHAPE_FILL
    const freehand = name === 'draw'
    const pts: { x: number; y: number }[] = [{ x: ox, y: oy }]
    let moved = false
    const move = (ev: PointerEvent) => {
      let x = (ev.clientX - rect.left) / scale
      let y = (ev.clientY - rect.top) / scale
      const dx = x - ox
      const dy = y - oy
      if (Math.abs(dx) > DRAW_SLOP || Math.abs(dy) > DRAW_SLOP) moved = true
      if (freehand) {
        const last = pts[pts.length - 1]
        if (Math.hypot(x - last.x, y - last.y) >= 2) pts.push({ x, y })
      } else {
        if (ev.shiftKey) {
          const len = Math.hypot(dx, dy)
          const step = Math.PI / 4
          const ang = Math.round(Math.atan2(dy, dx) / step) * step
          x = ox + Math.cos(ang) * len
          y = oy + Math.sin(ang) * len
        }
        pts[1] = { x, y }
      }
      const g = strokeGeometry(name, pts)
      setShapeDraft({ x: g.x, y: g.y, w: g.w, h: g.h, markup: g.markup })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setShapeDraft(null)
      if (!moved) {
        if (freehand) {
          editor.setPendingShape(null) // a bare click isn't a doodle
          return
        }
        pts[1] = { x: ox + 160, y: oy } // click drops a default horizontal line/arrow
      }
      const g = strokeGeometry(name, pts)
      insertShape(
        name,
        Math.round(g.x),
        Math.round(g.y),
        Math.round(g.w),
        Math.round(g.h),
        g.markup,
        fill,
      )
      editor.setPendingShape(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function beginDrawShape(e: RPointerEvent) {
    if (!editor.canEdit) return
    const name = editor.pendingShape
    if (!name) return
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const ox = (e.clientX - rect.left) / scale
    const oy = (e.clientY - rect.top) / scale
    if (isStrokeShape(name)) beginDrawStroke(name, ox, oy, rect)
    else beginDrawBox(name, ox, oy, rect)
  }

  // Bare-canvas pointer-down: draw a shape when the shape tool is armed, else marquee-select.
  function onCanvasPointerDown(e: RPointerEvent) {
    if (editor.pendingShape) beginDrawShape(e)
    else beginMarquee(e)
  }

  const selectedComponents = componentsInOrder(editor.selected)
  const selectedBounds = selectionBounds(
    selectedComponents.map(frameForComponent),
  )

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
        actions={inspectorActions}
        host={inspectorHost}
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
            background: bg,
            ...themeVars(deck, slideData),
          }}
        >
          <BackgroundImageLayer image={bgImg} />
          {/* Body underlay: the markdown doc, shown behind the editable objects but inert (its layer
              is pointer-events:none) so marquee/canvas clicks pass through. Skipped when empty, so a
              pure-objects slide is unchanged. */}
          {slideHasBody(slideData) && (
            <div className="slide-locked-layer">
              <MarkdownBodies slide={slideData} />
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
                  selected={editor.isSelected(c.id)}
                  editing={editingId === c.id}
                  onPointerDownBody={(e) => beginMove(c, e)}
                  onStartEdit={() =>
                    c.kind === 'text' && editor.canEdit && setEditingId(c.id)
                  }
                  onCommitEdit={(html) => commitText(c, html)}
                />
              )}
            </ComponentDataReader>
          ))}
          {selectedBounds &&
            selectedComponents.length > 0 &&
            !editingId &&
            !editor.pendingShape &&
            editor.canEdit && (
              <SelectionFrame
                bounds={selectedBounds}
                scale={scale}
                count={selectedComponents.length}
                onResize={(handle, event) =>
                  beginResize(selectedComponents, handle, event)
                }
                onRotate={(event) => beginRotate(selectedComponents, event)}
              />
            )}
          {guides.map((guide, index) => (
            <div
              key={`${guide.axis}-${guide.position}-${index}`}
              className={`precision-guide precision-guide--${guide.axis}`}
              style={
                guide.axis === 'x'
                  ? { left: guide.position, width: 1 / scale }
                  : { top: guide.position, height: 1 / scale }
              }
              aria-hidden
            />
          ))}
          {shapeDraft && editor.pendingShape && (
            <div
              className="shape-draft"
              style={{
                left: shapeDraft.x,
                top: shapeDraft.y,
                width: shapeDraft.w,
                height: shapeDraft.h,
                color: `#${DEFAULT_SHAPE_FILL}`,
              }}
              dangerouslySetInnerHTML={{ __html: shapeDraft.markup }}
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
  selected,
  editing,
  onPointerDownBody,
  onStartEdit,
  onCommitEdit,
}: {
  c: AnyComponent
  scale: number
  selected: boolean
  editing: boolean
  onPointerDownBody: (e: RPointerEvent) => void
  onStartEdit: () => void
  onCommitEdit: (html: string) => void
}) {
  return (
    <div
      className={componentClassName(c, selected ? ['is-selected'] : [])}
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
    </div>
  )
}

const RESIZE_HANDLES: readonly ResizeHandle[] = [
  'nw',
  'n',
  'ne',
  'e',
  'se',
  's',
  'sw',
  'w',
]

function SelectionFrame({
  bounds,
  scale,
  count,
  onResize,
  onRotate,
}: {
  bounds: PrecisionBounds
  scale: number
  count: number
  onResize: (handle: ResizeHandle, event: RPointerEvent) => void
  onRotate: (event: RPointerEvent) => void
}) {
  const counterScale = {
    transform: `translate(-50%, -50%) scale(${1 / scale})`,
  }
  return (
    <div
      className="precision-selection"
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.w,
        height: bounds.h,
        borderWidth: 1 / scale,
      }}
      aria-label={`${count} selected ${count === 1 ? 'object' : 'objects'}`}
    >
      <span
        className="precision-selection__rotate-stem"
        style={{
          top: -24 / scale,
          height: 24 / scale,
          borderLeftWidth: 1 / scale,
        }}
        aria-hidden
      />
      <span
        className="precision-selection__rotate"
        style={{ ...counterScale, top: -30 / scale }}
        aria-hidden="true"
        title="Rotate · Shift snaps to 15°"
        onPointerDown={onRotate}
      />
      {RESIZE_HANDLES.map((handle) => (
        <span
          key={handle}
          className={`precision-selection__handle precision-selection__handle--${handle}`}
          style={counterScale}
          aria-hidden="true"
          title="Resize · Shift keeps ratio · Option resizes from center"
          onPointerDown={(event) => onResize(handle, event)}
        />
      ))}
    </div>
  )
}

function alignmentLabel(alignment: Alignment): string {
  if (alignment === 'centerX') return 'center'
  if (alignment === 'middleY') return 'middle'
  return alignment
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
