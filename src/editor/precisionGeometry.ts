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

/**
 * Bounds are deliberately axis-aligned model bounds. Rotation is metadata on a
 * frame and does not change the box used by arrange and group-resize commands.
 */
export function selectionBounds(
  frames: readonly PrecisionFrame[],
): PrecisionBounds | null {
  if (frames.length === 0) return null

  let left = frames[0].x
  let right = frames[0].x + frames[0].w
  let top = frames[0].y
  let bottom = frames[0].y + frames[0].h

  for (const frame of frames.slice(1)) {
    left = Math.min(left, frame.x)
    right = Math.max(right, frame.x + frame.w)
    top = Math.min(top, frame.y)
    bottom = Math.max(bottom, frame.y + frame.h)
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
    if (alignment === 'left') return { ...frame, x: target.left }
    if (alignment === 'centerX') {
      return { ...frame, x: target.centerX - frame.w / 2 }
    }
    if (alignment === 'right') {
      return { ...frame, x: target.right - frame.w }
    }
    if (alignment === 'top') return { ...frame, y: target.top }
    if (alignment === 'middleY') {
      return { ...frame, y: target.middleY - frame.h / 2 }
    }
    return { ...frame, y: target.bottom - frame.h }
  })
}

/** Equalize gaps while keeping the first and last frame on the axis fixed. */
export function distributeFrames<T extends PrecisionFrame>(
  frames: readonly T[],
  axis: DistributionAxis,
): T[] {
  if (frames.length < 3) return [...frames]

  const position = axis === 'horizontal' ? 'x' : 'y'
  const size = axis === 'horizontal' ? 'w' : 'h'
  const sorted = frames
    .map((frame, index) => ({ frame, index }))
    .sort((a, b) => a.frame[position] - b.frame[position] || a.index - b.index)
  const first = sorted[0].frame
  const last = sorted[sorted.length - 1].frame
  const span = last[position] + last[size] - first[position]
  const occupied = sorted.reduce((total, item) => total + item.frame[size], 0)
  const gap = (span - occupied) / (sorted.length - 1)
  const positions = new Map<string, number>()

  let cursor = first[position] + first[size] + gap
  for (const { frame } of sorted.slice(1, -1)) {
    positions.set(frame.id, cursor)
    cursor += frame[size] + gap
  }

  return frames.map((frame) => {
    const next = positions.get(frame.id)
    return next === undefined ? frame : { ...frame, [position]: next }
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
 * Resize an axis-aligned selection from any of its eight handles. Each child is
 * transformed through the selection box, so relative positions are preserved;
 * rotation values pass through untouched.
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
    frames: frames.map((frame) => ({
      ...frame,
      x: after.x + (frame.x - before.x) * scaleX,
      y: after.y + (frame.y - before.y) * scaleY,
      w: frame.w * scaleX,
      h: frame.h * scaleY,
      rotate: frame.rotate,
    })),
  }
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
      ...eligiblePeers.flatMap((peer) => [
        {
          anchor: 'left' as const,
          position: peer.x,
          source: 'peer' as const,
          targetId: peer.id,
        },
        {
          anchor: 'center' as const,
          position: peer.x + peer.w / 2,
          source: 'peer' as const,
          targetId: peer.id,
        },
        {
          anchor: 'right' as const,
          position: peer.x + peer.w,
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
      ...eligiblePeers.flatMap((peer) => [
        {
          anchor: 'top' as const,
          position: peer.y,
          source: 'peer' as const,
          targetId: peer.id,
        },
        {
          anchor: 'middle' as const,
          position: peer.y + peer.h / 2,
          source: 'peer' as const,
          targetId: peer.id,
        },
        {
          anchor: 'bottom' as const,
          position: peer.y + peer.h,
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
