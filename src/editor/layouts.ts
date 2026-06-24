// Canned overview layouts (the "Arrange" command). Unlike old Strut — which swapped in a second engine
// (Bespoke) to drive canned arrangements — we keep the single impress-style 3-D camera and just compute
// per-slide transforms. A layout is therefore a pure function `(count) → transform[]`, one entry per
// slide in camera order; the picker writes them through `setSlideTransform` as one undoable step, and
// the same camera (Overview + Play + impress export) flies through whatever we lay down.
//
// Everything is in overview "card units" (x/y; a card is 240 wide). `z` depth isn't rendered yet, so
// these layouts use x/y + rotation only; depth-aware layouts (stack/cube) can come once z is wired.

import { OVERVIEW_CARD_GAP } from '../config'

export interface LayoutTransform {
  x: number
  y: number
  z: number
  rotate_x: number
  rotate_y: number
  rotate_z: number
  imp_scale: number
}

export interface LayoutDef {
  id: string
  label: string
  /** Positions for `count` slides, index 0 = first in camera order. */
  arrange: (count: number) => LayoutTransform[]
}

const GAP_X = OVERVIEW_CARD_GAP // 360 — ~1.5 card widths between centers
const GAP_Y = 240 // card height (135) + breathing room
const SCALE = 3 // default impScale
const RAD = (deg: number) => (deg * Math.PI) / 180

// Full transform with sensible defaults; spread `extra` to override specific fields.
const T = (
  x: number,
  y: number,
  extra: Partial<LayoutTransform> = {},
): LayoutTransform => ({
  x: Math.round(x),
  y: Math.round(y),
  z: 0,
  rotate_x: 0,
  rotate_y: 0,
  rotate_z: 0,
  imp_scale: SCALE,
  ...extra,
})

// Deterministic pseudo-random in [0,1) — keyed on index + salt so scatter is stable across
// re-renders and survives undo/redo identically (no Math.random()).
const rand = (i: number, salt: number) => {
  const v = Math.sin((i + 1) * salt) * 43758.5453
  return v - Math.floor(v)
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i)

// Near-square grid, row-major, centered on the origin.
function grid(n: number): LayoutTransform[] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(n)))
  const rows = Math.ceil(n / cols)
  return range(n).map((i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    return T((col - (cols - 1) / 2) * GAP_X, (row - (rows - 1) / 2) * GAP_Y)
  })
}

// Single horizontal row.
function line(n: number): LayoutTransform[] {
  return range(n).map((i) => T((i - (n - 1) / 2) * GAP_X, 0))
}

// Even ring, first slide at top, going clockwise.
function circle(n: number): LayoutTransform[] {
  if (n === 1) return [T(0, 0)]
  const r = Math.max(GAP_X, (GAP_X * n) / (2 * Math.PI))
  return range(n).map((i) => {
    const a = -Math.PI / 2 + (i / n) * 2 * Math.PI
    return T(r * Math.cos(a), r * Math.sin(a))
  })
}

// Apple cover-flow: a tight horizontal strip; the centre card faces front, side cards angle away
// (rotateY) and shrink slightly to read as receding into depth.
function coverflow(n: number): LayoutTransform[] {
  const center = (n - 1) / 2
  const spacing = GAP_X * 0.66 // slight overlap
  return range(n).map((i) => {
    const d = i - center
    const rotate_y = d === 0 ? 0 : d < 0 ? RAD(42) : RAD(-42)
    return T(d * spacing, 0, {
      rotate_y,
      imp_scale: d === 0 ? SCALE : SCALE * 0.85,
    })
  })
}

// Scattered-on-a-desk: a loose grid with per-card jitter in position, angle, and size.
function scatter(n: number): LayoutTransform[] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(n)))
  const rows = Math.ceil(n / cols)
  return range(n).map((i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const jx = (rand(i, 12.9898) - 0.5) * GAP_X * 0.5
    const jy = (rand(i, 78.233) - 0.5) * GAP_Y * 0.5
    return T(
      (col - (cols - 1) / 2) * GAP_X * 1.15 + jx,
      (row - (rows - 1) / 2) * GAP_Y * 1.15 + jy,
      {
        rotate_z: (rand(i, 39.425) - 0.5) * RAD(40),
        imp_scale: SCALE * (0.85 + rand(i, 27.61) * 0.3),
      },
    )
  })
}

export const LAYOUTS: LayoutDef[] = [
  { id: 'grid', label: 'Grid', arrange: grid },
  { id: 'line', label: 'Line', arrange: line },
  { id: 'circle', label: 'Circle', arrange: circle },
  { id: 'coverflow', label: 'Cover flow', arrange: coverflow },
  { id: 'scatter', label: 'Scatter', arrange: scatter },
]
