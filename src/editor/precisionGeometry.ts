/**
 * Pure geometry commands for precise object manipulation.
 *
 * The align, distribute, and adjacent z-order behavior is adapted from Bento's
 * arrange kit. Copyright (c) 2026 The Bento/Suite authors, used under the MIT
 * License. The implementation here is immutable and independent of Bento's DOM
 * and snapshot store.
 */

export interface PrecisionFrame {
  id: string
  x: number
  y: number
  w: number
  h: number
  rotate: number
}

export interface PrecisionBounds {
  x: number
  y: number
  w: number
  h: number
  left: number
  centerX: number
  right: number
  top: number
  middleY: number
  bottom: number
}

export interface PrecisionSize {
  w: number
  h: number
}

export interface PrecisionDelta {
  x: number
  y: number
}

export const PRECISION_CANVAS: Readonly<PrecisionSize> = {
  w: 1280,
  h: 720,
}

export type Alignment =
  | 'left'
  | 'centerX'
  | 'right'
  | 'top'
  | 'middleY'
  | 'bottom'

export type DistributionAxis = 'horizontal' | 'vertical'
export type MatchDimension = 'width' | 'height'

/** Axis-aligned bounds of the frame after its box is rotated around its center. */
export function frameBounds(frame: PrecisionFrame): PrecisionBounds {
  const centerX = frame.x + frame.w / 2
  const centerY = frame.y + frame.h / 2
  const cos = Math.abs(Math.cos(frame.rotate))
  const sin = Math.abs(Math.sin(frame.rotate))
  const w = cos * Math.abs(frame.w) + sin * Math.abs(frame.h)
  const h = sin * Math.abs(frame.w) + cos * Math.abs(frame.h)

  return boundsFromEdges(
    centerX - w / 2,
    centerY - h / 2,
    centerX + w / 2,
    centerY + h / 2,
  )
}

/** Union of the frames' visible, rotation-aware axis-aligned bounds. */
export function selectionBounds(
  frames: readonly PrecisionFrame[],
): PrecisionBounds | null {
  if (frames.length === 0) return null

  const first = frameBounds(frames[0])
  let { left, right, top, bottom } = first

  for (const frame of frames.slice(1)) {
    const bounds = frameBounds(frame)
    left = Math.min(left, bounds.left)
    right = Math.max(right, bounds.right)
    top = Math.min(top, bounds.top)
    bottom = Math.max(bottom, bounds.bottom)
  }

  return boundsFromEdges(left, top, right, bottom)
}

export function nudgeFrames<T extends PrecisionFrame>(
  frames: readonly T[],
  dx: number,
  dy: number,
): T[] {
  return frames.map((frame) => ({
    ...frame,
    x: frame.x + dx,
    y: frame.y + dy,
  }))
}

/**
 * A single frame aligns to the canvas. Multiple frames align to the selection's
 * own bounds, matching the behavior of a compact arrange panel.
 */
export function alignFrames<T extends PrecisionFrame>(
  frames: readonly T[],
  alignment: Alignment,
  canvas: Readonly<PrecisionSize> = PRECISION_CANVAS,
): T[] {
  const selection = selectionBounds(frames)
  if (!selection) return []

  const target =
    frames.length === 1 ? boundsFromEdges(0, 0, canvas.w, canvas.h) : selection

  return frames.map((frame) => {
    const bounds = frameBounds(frame)
    if (alignment === 'left') {
      return { ...frame, x: frame.x + target.left - bounds.left }
    }
    if (alignment === 'centerX') {
      return { ...frame, x: frame.x + target.centerX - bounds.centerX }
    }
    if (alignment === 'right') {
      return { ...frame, x: frame.x + target.right - bounds.right }
    }
    if (alignment === 'top') {
      return { ...frame, y: frame.y + target.top - bounds.top }
    }
    if (alignment === 'middleY') {
      return { ...frame, y: frame.y + target.middleY - bounds.middleY }
    }
    return { ...frame, y: frame.y + target.bottom - bounds.bottom }
  })
}

/** Equalize gaps while keeping the first and last frame on the axis fixed. */
export function distributeFrames<T extends PrecisionFrame>(
  frames: readonly T[],
  axis: DistributionAxis,
): T[] {
  if (frames.length < 3) return [...frames]

  const sorted = frames
    .map((frame, index) => ({ frame, bounds: frameBounds(frame), index }))
    .sort(
      (a, b) =>
        axisStart(a.bounds, axis) - axisStart(b.bounds, axis) ||
        a.index - b.index,
    )
  const first = sorted[0].bounds
  const last = sorted[sorted.length - 1].bounds
  const span = axisEnd(last, axis) - axisStart(first, axis)
  const occupied = sorted.reduce(
    (total, item) => total + axisSize(item.bounds, axis),
    0,
  )
  const gap = (span - occupied) / (sorted.length - 1)
  const positions = new Map<string, number>()

  let cursor = axisEnd(first, axis) + gap
  for (const { frame, bounds } of sorted.slice(1, -1)) {
    positions.set(frame.id, cursor)
    cursor += axisSize(bounds, axis) + gap
  }

  return frames.map((frame) => {
    const next = positions.get(frame.id)
    if (next === undefined) return frame
    const bounds = frameBounds(frame)
    const offset = next - axisStart(bounds, axis)
    return axis === 'horizontal'
      ? { ...frame, x: frame.x + offset }
      : { ...frame, y: frame.y + offset }
  })
}

/** The first supplied frame is the size reference. */
export function matchFrameSize<T extends PrecisionFrame>(
  frames: readonly T[],
  dimension: MatchDimension,
): T[] {
  if (frames.length < 2) return [...frames]
  const property = dimension === 'width' ? 'w' : 'h'
  const value = frames[0][property]
  return frames.map((frame) => ({ ...frame, [property]: value }))
}

export interface PrecisionZItem {
  id: string
  z: number
}

export type ZReorderAction = 'front' | 'forward' | 'backward' | 'back'

export interface ZOrderMove {
  id: string
  fromIndex: number
  toIndex: number
}

export interface ZOrderAssignment {
  id: string
  previousZ: number
  z: number
}

export interface ZReorderPlan {
  /** Bottom-to-top paint order after the operation. */
  orderedIds: string[]
  /** Only entries whose relative index changed. */
  moves: ZOrderMove[]
  /** Collision-free ranks for callers that persist numeric z values. */
  assignments: ZOrderAssignment[]
  /** Collision-free ranks that restore the exact observed input paint order, including tied z values. */
  undoAssignments: Array<{ id: string; z: number }>
}

/**
 * Produce a deterministic bottom-to-top order. Equal input z values keep their
 * caller-supplied order. Forward/backward move the selection across one adjacent
 * unselected layer while preserving order inside the selection.
 */
export function planZReorder(
  items: readonly PrecisionZItem[],
  selectedIds: Iterable<string>,
  action: ZReorderAction,
): ZReorderPlan {
  const ordered = items
    .map((item, inputIndex) => ({ item, inputIndex }))
    .sort((a, b) => a.item.z - b.item.z || a.inputIndex - b.inputIndex)
    .map(({ item }) => item)
  const undoAssignments = ordered.map((item, z) => ({ id: item.id, z }))
  const beforeIndex = new Map(ordered.map((item, index) => [item.id, index]))
  const selected = new Set(selectedIds)
  const hasSelected = ordered.some((item) => selected.has(item.id))

  if (hasSelected && action === 'front') {
    const stationary = ordered.filter((item) => !selected.has(item.id))
    const moving = ordered.filter((item) => selected.has(item.id))
    ordered.splice(0, ordered.length, ...stationary, ...moving)
  } else if (hasSelected && action === 'back') {
    const stationary = ordered.filter((item) => !selected.has(item.id))
    const moving = ordered.filter((item) => selected.has(item.id))
    ordered.splice(0, ordered.length, ...moving, ...stationary)
  } else if (hasSelected) {
    const direction = action === 'forward' ? 1 : -1
    const indices = ordered
      .map((item, index) => (selected.has(item.id) ? index : -1))
      .filter((index) => index >= 0)
    const traversal = direction > 0 ? indices.reverse() : indices

    for (const index of traversal) {
      const adjacent = index + direction
      if (
        adjacent < 0 ||
        adjacent >= ordered.length ||
        selected.has(ordered[adjacent].id)
      ) {
        continue
      }
      ;[ordered[index], ordered[adjacent]] = [ordered[adjacent], ordered[index]]
    }
  }

  const orderedIds = ordered.map((item) => item.id)
  const moves = orderedIds.flatMap((id, toIndex) => {
    const fromIndex = beforeIndex.get(id)
    return fromIndex === undefined || fromIndex === toIndex
      ? []
      : [{ id, fromIndex, toIndex }]
  })

  return {
    orderedIds,
    moves,
    assignments: ordered.map((item, z) => ({
      id: item.id,
      previousZ: item.z,
      z,
    })),
    undoAssignments,
  }
}

export type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'

export interface GroupResizeOptions {
  aspectLock?: boolean
  center?: boolean
  /** Smallest active selection dimension. Defaults to zero; flipping is not allowed. */
  minSize?: number
}

export interface GroupResizeResult<T extends PrecisionFrame> {
  frames: T[]
  bounds: PrecisionBounds | null
}

/**
 * Resize a selection's visual AABB from any of its eight handles. Child centers
 * are mapped through that visible box before local dimensions are scaled, so a
 * rotated child's model-box offset does not make it drift. Rotation passes
 * through untouched.
 */
export function resizeGroupFrames<T extends PrecisionFrame>(
  frames: readonly T[],
  handle: ResizeHandle,
  delta: Readonly<PrecisionDelta>,
  options: Readonly<GroupResizeOptions> = {},
): GroupResizeResult<T> {
  const before = selectionBounds(frames)
  if (!before || before.w <= 0 || before.h <= 0) {
    return { frames: [...frames], bounds: before }
  }

  const horizontal = handle.includes('e') ? 1 : handle.includes('w') ? -1 : 0
  const vertical = handle.includes('s') ? 1 : handle.includes('n') ? -1 : 0
  const center = options.center === true
  const minSize = Math.max(0, options.minSize ?? 0)
  const multiplier = center ? 2 : 1
  const rawWidth =
    horizontal === 0 ? before.w : before.w + horizontal * delta.x * multiplier
  const rawHeight =
    vertical === 0 ? before.h : before.h + vertical * delta.y * multiplier

  let width = horizontal === 0 ? before.w : Math.max(minSize, rawWidth)
  let height = vertical === 0 ? before.h : Math.max(minSize, rawHeight)

  if (options.aspectLock) {
    const horizontalScale = horizontal === 0 ? null : rawWidth / before.w
    const verticalScale = vertical === 0 ? null : rawHeight / before.h
    let scale: number

    if (horizontalScale === null) scale = verticalScale ?? 1
    else if (verticalScale === null) scale = horizontalScale
    else {
      scale =
        Math.abs(horizontalScale - 1) >= Math.abs(verticalScale - 1)
          ? horizontalScale
          : verticalScale
    }

    scale = Math.max(minSize / before.w, minSize / before.h, scale)
    width = before.w * scale
    height = before.h * scale
  }

  const x = resizedAxisStart(
    before.left,
    before.right,
    width,
    horizontal,
    center,
    options.aspectLock === true,
  )
  const y = resizedAxisStart(
    before.top,
    before.bottom,
    height,
    vertical,
    center,
    options.aspectLock === true,
  )
  const after = boundsFromEdges(x, y, x + width, y + height)
  const scaleX = width / before.w
  const scaleY = height / before.h

  return {
    bounds: after,
    frames: frames.map((frame) => {
      const centerX = frame.x + frame.w / 2
      const centerY = frame.y + frame.h / 2
      const nextW = frame.w * scaleX
      const nextH = frame.h * scaleY
      const nextCenterX = after.x + (centerX - before.x) * scaleX
      const nextCenterY = after.y + (centerY - before.y) * scaleY
      return {
        ...frame,
        x: nextCenterX - nextW / 2,
        y: nextCenterY - nextH / 2,
        w: nextW,
        h: nextH,
        rotate: frame.rotate,
      }
    }),
  }
}

export interface FrameResizeResult<T extends PrecisionFrame> {
  frame: T
  bounds: PrecisionBounds
}

/**
 * Resize one rotated frame along its own axes. The pointer delta arrives in
 * canvas coordinates and is projected into the frame's local coordinate space;
 * moving an edge therefore keeps its opposite edge fixed on screen at any
 * angle. Aspect-locked perpendicular growth remains centered, and `center`
 * keeps the frame center fixed.
 */
export function resizeFrameInLocalAxes<T extends PrecisionFrame>(
  frame: T,
  handle: ResizeHandle,
  delta: Readonly<PrecisionDelta>,
  options: Readonly<GroupResizeOptions> = {},
): FrameResizeResult<T> {
  if (frame.w <= 0 || frame.h <= 0) {
    return { frame: { ...frame }, bounds: frameBounds(frame) }
  }

  const horizontal = handle.includes('e') ? 1 : handle.includes('w') ? -1 : 0
  const vertical = handle.includes('s') ? 1 : handle.includes('n') ? -1 : 0
  const cos = Math.cos(frame.rotate)
  const sin = Math.sin(frame.rotate)
  const localDelta = {
    x: cos * delta.x + sin * delta.y,
    y: -sin * delta.x + cos * delta.y,
  }
  const center = options.center === true
  const minSize = Math.max(0, options.minSize ?? 0)
  const multiplier = center ? 2 : 1
  const rawWidth =
    horizontal === 0
      ? frame.w
      : frame.w + horizontal * localDelta.x * multiplier
  const rawHeight =
    vertical === 0 ? frame.h : frame.h + vertical * localDelta.y * multiplier

  let width = horizontal === 0 ? frame.w : Math.max(minSize, rawWidth)
  let height = vertical === 0 ? frame.h : Math.max(minSize, rawHeight)

  if (options.aspectLock) {
    const horizontalScale = horizontal === 0 ? null : rawWidth / frame.w
    const verticalScale = vertical === 0 ? null : rawHeight / frame.h
    let scale: number
    if (horizontalScale === null) scale = verticalScale ?? 1
    else if (verticalScale === null) scale = horizontalScale
    else {
      scale =
        Math.abs(horizontalScale - 1) >= Math.abs(verticalScale - 1)
          ? horizontalScale
          : verticalScale
    }
    scale = Math.max(minSize / frame.w, minSize / frame.h, scale)
    width = frame.w * scale
    height = frame.h * scale
  }

  const shiftX =
    center || horizontal === 0 ? 0 : (horizontal * (width - frame.w)) / 2
  const shiftY =
    center || vertical === 0 ? 0 : (vertical * (height - frame.h)) / 2
  const centerX = frame.x + frame.w / 2 + cos * shiftX - sin * shiftY
  const centerY = frame.y + frame.h / 2 + sin * shiftX + cos * shiftY
  const resized = {
    ...frame,
    x: centerX - width / 2,
    y: centerY - height / 2,
    w: width,
    h: height,
  }

  return { frame: resized, bounds: frameBounds(resized) }
}

export type HorizontalSnapAnchor = 'left' | 'center' | 'right'
export type VerticalSnapAnchor = 'top' | 'middle' | 'bottom'

export interface SnapGuide {
  axis: 'x' | 'y'
  position: number
  source: 'canvas' | 'peer'
  targetId?: string
  movingAnchor: HorizontalSnapAnchor | VerticalSnapAnchor
  targetAnchor: HorizontalSnapAnchor | VerticalSnapAnchor
}

export interface SnapMoveOptions {
  /** Threshold in canvas units. Convert a screen-pixel threshold before calling. */
  threshold: number
  canvas?: Readonly<PrecisionSize>
}

export interface SnapMoveResult<T extends PrecisionFrame> {
  frames: T[]
  delta: PrecisionDelta
  /** At most one quiet guide per axis. */
  guides: SnapGuide[]
}

/**
 * Snap a proposed selection move to canvas and peer edge/center guides. The
 * closest target wins independently on each axis, and only winning guides are
 * returned so the UI does not need to filter guideline noise.
 */
export function snapMove<T extends PrecisionFrame>(
  frames: readonly T[],
  delta: Readonly<PrecisionDelta>,
  peers: readonly PrecisionFrame[],
  options: Readonly<SnapMoveOptions>,
): SnapMoveResult<T> {
  const bounds = selectionBounds(frames)
  if (!bounds) return { frames: [], delta: { ...delta }, guides: [] }

  const canvas = options.canvas ?? PRECISION_CANVAS
  const threshold = Math.max(0, options.threshold)
  const selected = new Set(frames.map((frame) => frame.id))
  const eligiblePeers = peers.filter((peer) => !selected.has(peer.id))
  const peerBounds = eligiblePeers.map((peer) => ({
    peer,
    bounds: frameBounds(peer),
  }))

  const xCandidate = bestSnapCandidate(
    [
      { anchor: 'left' as const, position: bounds.left + delta.x },
      { anchor: 'center' as const, position: bounds.centerX + delta.x },
      { anchor: 'right' as const, position: bounds.right + delta.x },
    ],
    [
      { anchor: 'left' as const, position: 0, source: 'canvas' as const },
      {
        anchor: 'center' as const,
        position: canvas.w / 2,
        source: 'canvas' as const,
      },
      {
        anchor: 'right' as const,
        position: canvas.w,
        source: 'canvas' as const,
      },
      ...peerBounds.flatMap(({ peer, bounds: peerFrameBounds }) => [
        {
          anchor: 'left' as const,
          position: peerFrameBounds.left,
          source: 'peer' as const,
          targetId: peer.id,
        },
        {
          anchor: 'center' as const,
          position: peerFrameBounds.centerX,
          source: 'peer' as const,
          targetId: peer.id,
        },
        {
          anchor: 'right' as const,
          position: peerFrameBounds.right,
          source: 'peer' as const,
          targetId: peer.id,
        },
      ]),
    ],
    threshold,
    'x',
  )
  const yCandidate = bestSnapCandidate(
    [
      { anchor: 'top' as const, position: bounds.top + delta.y },
      { anchor: 'middle' as const, position: bounds.middleY + delta.y },
      { anchor: 'bottom' as const, position: bounds.bottom + delta.y },
    ],
    [
      { anchor: 'top' as const, position: 0, source: 'canvas' as const },
      {
        anchor: 'middle' as const,
        position: canvas.h / 2,
        source: 'canvas' as const,
      },
      {
        anchor: 'bottom' as const,
        position: canvas.h,
        source: 'canvas' as const,
      },
      ...peerBounds.flatMap(({ peer, bounds: peerFrameBounds }) => [
        {
          anchor: 'top' as const,
          position: peerFrameBounds.top,
          source: 'peer' as const,
          targetId: peer.id,
        },
        {
          anchor: 'middle' as const,
          position: peerFrameBounds.middleY,
          source: 'peer' as const,
          targetId: peer.id,
        },
        {
          anchor: 'bottom' as const,
          position: peerFrameBounds.bottom,
          source: 'peer' as const,
          targetId: peer.id,
        },
      ]),
    ],
    threshold,
    'y',
  )
  const snappedDelta = {
    x: delta.x + (xCandidate?.offset ?? 0),
    y: delta.y + (yCandidate?.offset ?? 0),
  }

  return {
    frames: nudgeFrames(frames, snappedDelta.x, snappedDelta.y),
    delta: snappedDelta,
    guides: [xCandidate?.guide, yCandidate?.guide].filter(
      (guide): guide is SnapGuide => guide !== undefined,
    ),
  }
}

function boundsFromEdges(
  left: number,
  top: number,
  right: number,
  bottom: number,
): PrecisionBounds {
  return {
    x: left,
    y: top,
    w: right - left,
    h: bottom - top,
    left,
    centerX: (left + right) / 2,
    right,
    top,
    middleY: (top + bottom) / 2,
    bottom,
  }
}

function axisStart(bounds: PrecisionBounds, axis: DistributionAxis): number {
  return axis === 'horizontal' ? bounds.left : bounds.top
}

function axisEnd(bounds: PrecisionBounds, axis: DistributionAxis): number {
  return axis === 'horizontal' ? bounds.right : bounds.bottom
}

function axisSize(bounds: PrecisionBounds, axis: DistributionAxis): number {
  return axis === 'horizontal' ? bounds.w : bounds.h
}

function resizedAxisStart(
  start: number,
  end: number,
  nextSize: number,
  direction: -1 | 0 | 1,
  fromCenter: boolean,
  perpendicularAspectChange: boolean,
): number {
  if (fromCenter || (direction === 0 && perpendicularAspectChange)) {
    return (start + end) / 2 - nextSize / 2
  }
  if (direction < 0) return end - nextSize
  return start
}

interface MovingSnapAnchor<T extends string> {
  anchor: T
  position: number
}

interface TargetSnapAnchor<T extends string> extends MovingSnapAnchor<T> {
  source: 'canvas' | 'peer'
  targetId?: string
}

interface SnapCandidate {
  offset: number
  guide: SnapGuide
  distance: number
  sourcePriority: number
  targetIndex: number
  movingIndex: number
}

function bestSnapCandidate<T extends string>(
  moving: readonly MovingSnapAnchor<T>[],
  targets: readonly TargetSnapAnchor<T>[],
  threshold: number,
  axis: 'x' | 'y',
): SnapCandidate | null {
  const candidates: SnapCandidate[] = []

  for (const [movingIndex, movingAnchor] of moving.entries()) {
    for (const [targetIndex, target] of targets.entries()) {
      const offset = target.position - movingAnchor.position
      const distance = Math.abs(offset)
      if (distance > threshold) continue
      candidates.push({
        offset,
        distance,
        sourcePriority: target.source === 'canvas' ? 0 : 1,
        targetIndex,
        movingIndex,
        guide: {
          axis,
          position: target.position,
          source: target.source,
          targetId: target.targetId,
          movingAnchor: movingAnchor.anchor as SnapGuide['movingAnchor'],
          targetAnchor: target.anchor as SnapGuide['targetAnchor'],
        },
      })
    }
  }

  candidates.sort(
    (a, b) =>
      a.distance - b.distance ||
      a.sourcePriority - b.sourcePriority ||
      a.targetIndex - b.targetIndex ||
      a.movingIndex - b.movingIndex,
  )
  return candidates[0] ?? null
}
