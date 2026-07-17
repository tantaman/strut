// Shared editor types: a unified "component" view over the polymorphic Rindle `component` table,
// plus the shape catalog and theme-resolution helpers.

import { parseProps } from '../../shared/componentProps'
import type { ComponentProps, ComponentType } from '../../shared/componentProps'
import { DEFAULT_FONT, SLIDE_H, SLIDE_W } from '../config'

export type ComponentKind = ComponentType

/** Spatial base — the real columns shared by every component row. */
export interface SpatialBase {
  id: string
  slide_id: string
  z_order: number
  x: number
  y: number
  scale_x: number
  scale_y: number
  scale_w: number
  scale_h: number
  rotate: number
  skew_x: number
  skew_y: number
  custom_classes: string
}

/** A raw `component` row as it materializes off a fragment/query: spatial base + `type` discriminator
 *  + `fill` column + the typed `props` JSON object (json<ComponentProps>()). */
export interface ComponentRow extends SpatialBase {
  type: string
  fill: string
  props: ComponentProps
}

/** The flat, in-memory component the editor works with: spatial base + `kind` + `fill` + the decoded
 *  props fields. There's one table now, so no `table` tag. */
export type AnyComponent = SpatialBase & {
  kind: ComponentKind
  fill?: string
  // text ('' color/font_family = inherit the deck theme default for text_type; see DeckThemeFields)
  text?: string
  size?: number
  color?: string
  font_family?: string
  text_type?: string
  // image / video / webframe / artifact
  src?: string
  image_type?: string
  // shape
  shape?: string
  markup?: string
  // video
  video_type?: string
  src_type?: string
  short_src?: string
  // artifact — author source; `src` (above) is the built+served sandboxed HTML the iframe loads
  code?: string
}

/** Decode one `component` row into the flat in-memory shape: spatial columns + `fill` + the `props`
 *  blob spread on top, tagged with `kind`. */
export function componentFromRow(row: ComponentRow): AnyComponent {
  return {
    id: row.id,
    slide_id: row.slide_id,
    z_order: row.z_order,
    x: row.x,
    y: row.y,
    scale_x: row.scale_x,
    scale_y: row.scale_y,
    scale_w: row.scale_w,
    scale_h: row.scale_h,
    rotate: row.rotate,
    skew_x: row.skew_x,
    skew_y: row.skew_y,
    custom_classes: row.custom_classes,
    kind: row.type as ComponentKind,
    fill: row.fill || undefined,
    ...parseProps(row.props),
  }
}

/** Decode + z-order a set of component rows (export / one-shot read path; the live query already
 *  orders by z_order, but a defensive sort keeps snapshots stable). */
export function componentsFromRows(
  rows: readonly ComponentRow[],
): AnyComponent[] {
  return rows.map(componentFromRow).sort((a, b) => a.z_order - b.z_order)
}

// ---- shape catalog (Excalidraw-style set) --------------------------------------------------------

// Box shapes: an outlined SVG stretched to the component box (`preserveAspectRatio="none"`) — a
// transparent fill and a `currentColor` stroke, so the `fill` field drives the outline color exactly
// as it drives the stroke shapes below. `vector-effect:non-scaling-stroke` keeps the outline crisp at
// any box size (stroke-width matches STROKE_W). Mirrors Excalidraw's defaults: core primitives, no
// fill, thin ink outline.
const BOX_STROKE = `fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" vector-effect="non-scaling-stroke"`
export const SHAPES: Record<string, string> = {
  rectangle: `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><rect x="0" y="0" width="100" height="100" ${BOX_STROKE}/></svg>`,
  diamond: `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="50,0 100,50 50,100 0,50" ${BOX_STROKE}/></svg>`,
  ellipse: `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><ellipse cx="50" cy="50" rx="50" ry="50" ${BOX_STROKE}/></svg>`,
}

export const SHAPE_NAMES = Object.keys(SHAPES)

// Stroke shapes (line, arrow, freehand draw) can't be static: they're baked at creation from the
// captured pointer geometry into a real-coordinate SVG. `vector-effect:non-scaling-stroke` keeps the
// stroke crisp at any box size and `currentColor` lets the `fill` field drive the stroke color (just
// as it drives the fill of the box shapes above).
export function isStrokeShape(name: string): boolean {
  return name === 'arrow' || name === 'line' || name === 'draw'
}

// The shape-menu order + implicit keyboard shortcut (index 0 → key "2", mirroring Excalidraw's 2–7).
export const SHAPE_TOOLS = [
  'rectangle',
  'diamond',
  'ellipse',
  'arrow',
  'line',
  'draw',
] as const
export type ShapeTool = (typeof SHAPE_TOOLS)[number]

/** Default color for a freshly-drawn shape — Excalidraw's dark ink, shared by outlined box shapes and
 *  stroke shapes alike (the `fill` field is the stroke color for both). Stored bare (no `#`). */
export const DEFAULT_SHAPE_FILL = '1e1e1e'

const STROKE_W = 4
type Pt = { x: number; y: number }
const r1 = (n: number) => Math.round(n * 10) / 10

// The inner SVG body for a stroke shape, in the box's local coordinate space (0..w, 0..h).
function strokeBody(name: string, pts: Pt[], w: number, h: number): string {
  const stroke = `stroke="currentColor" stroke-width="${STROKE_W}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"`
  if (name === 'draw') {
    if (pts.length < 2) {
      const p = pts[0] ?? { x: w / 2, y: h / 2 }
      return `<circle cx="${r1(p.x)}" cy="${r1(p.y)}" r="${STROKE_W / 2}" fill="currentColor"/>`
    }
    // Quadratic smoothing: each vertex is a control point, midpoints are the on-curve joins.
    let d = `M ${r1(pts[0].x)} ${r1(pts[0].y)}`
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2
      const my = (pts[i].y + pts[i + 1].y) / 2
      d += ` Q ${r1(pts[i].x)} ${r1(pts[i].y)} ${r1(mx)} ${r1(my)}`
    }
    const last = pts[pts.length - 1]
    d += ` L ${r1(last.x)} ${r1(last.y)}`
    return `<path d="${d}" fill="none" ${stroke}/>`
  }
  // line / arrow — the segment from the first to the last captured point.
  const a = pts[0]
  const b = pts[pts.length - 1]
  const line = `<line x1="${r1(a.x)}" y1="${r1(a.y)}" x2="${r1(b.x)}" y2="${r1(b.y)}" ${stroke}/>`
  if (name === 'line') return line
  // arrow: an open "V" head at the end point, sized to the segment but clamped.
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const head = Math.max(10, Math.min(28, len * 0.28))
  const px = -uy // perpendicular
  const py = ux
  const spread = 0.55
  const baseX = b.x - ux * head
  const baseY = b.y - uy * head
  const w1 = `${r1(baseX + px * head * spread)},${r1(baseY + py * head * spread)}`
  const w2 = `${r1(baseX - px * head * spread)},${r1(baseY - py * head * spread)}`
  return `${line}<polyline points="${w1} ${r1(b.x)},${r1(b.y)} ${w2}" fill="none" ${stroke}/>`
}

/** Bake a stroke shape from raw slide-coordinate points into a component box + SVG markup. The box is
 *  the points' bounding box, padded so a near-axis-aligned line stays grabbable and the viewBox never
 *  goes degenerate. Local coords are baked into a real-size viewBox so the stroke reads at ~STROKE_W
 *  px regardless of later scaling. */
export function strokeGeometry(
  name: string,
  pts: Pt[],
): { x: number; y: number; w: number; h: number; markup: string } {
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  let minX = Math.min(...xs)
  let minY = Math.min(...ys)
  let w = Math.max(...xs) - minX
  let h = Math.max(...ys) - minY
  const PAD = 14
  if (w < PAD) {
    minX -= (PAD - w) / 2
    w = PAD
  }
  if (h < PAD) {
    minY -= (PAD - h) / 2
    h = PAD
  }
  const local = pts.map((p) => ({ x: p.x - minX, y: p.y - minY }))
  const markup = `<svg viewBox="0 0 ${r1(w)} ${r1(h)}" preserveAspectRatio="none">${strokeBody(name, local, w, h)}</svg>`
  return { x: minX, y: minY, w, h, markup }
}

// ---- deck text theme ------------------------------------------------------------------------------

/** The deck's text-theme default columns ('' / null = built-in default: Lato / 111111). Text
 *  components fall into two categories — 'heading' | 'body' (`text_type`, '' = body) — and a text
 *  component with an empty color/font_family inherits the deck default for its category. */
export interface DeckThemeFields {
  heading_font?: string | null
  heading_color?: string | null
  body_font?: string | null
  body_color?: string | null
  // Deck-wide default text alignment ('' / null = built-in 'left'). The one theme axis a slide can
  // override (slide.text_align); fonts/colors are deck-only.
  text_align?: string | null
}

/** The slide-side columns the shared presentation resolution reads: the alignment override, the two
 *  inputs to the body's region (its own pin + the background whose image supplies the auto rule), and
 *  the layout tiling. `layout` (when a real multi-cell tiling) supersedes `body_region` — the body
 *  takes the layout's first cell; see bodyCells / rectBodyStyle. */
export interface SlideThemeFields {
  text_align?: string | null
  background?: string | null
  body_region?: string | null
  layout?: string | null
}

/** A deck as the presentation resolvers see it: text theme + the background the slide falls back to. */
export type DeckPresentationFields = DeckThemeFields & {
  background?: string | null
}

export const TEXT_TYPES = ['body', 'heading'] as const
export type TextType = (typeof TEXT_TYPES)[number]

/** Normalize a stored `text_type` ('' / absent = body, so legacy rows need no backfill). */
export function textTypeOf(c: { text_type?: string }): TextType {
  return c.text_type === 'heading' ? 'heading' : 'body'
}

// ---- unified theme resolution --------------------------------------------------------------------

export const TEXT_ALIGNS = ['left', 'center', 'right'] as const
export type TextAlign = (typeof TEXT_ALIGNS)[number]
export const DEFAULT_TEXT_COLOR = '111111'

/** Resolve the effective text alignment: a per-slide override wins, else the deck default, else the
 *  built-in 'left'. Empty strings / nulls mean "inherit". */
export function resolveTextAlign(
  slideAlign: string | null | undefined,
  deckAlign: string | null | undefined,
): TextAlign {
  const v = (slideAlign && slideAlign !== '' ? slideAlign : deckAlign) || 'left'
  return v === 'center' || v === 'right' ? v : 'left'
}

// ---- body region ---------------------------------------------------------------------------------
// Which part of the 1280×720 canvas the markdown body occupies. The slide column stores INTENT ('' =
// auto, else a pinned region); the geometry below is DERIVED, so the two can evolve apart — a future
// free-rect body can keep these names as presets that produce one, with no migration.
//
// Named `region`, deliberately not `layout`: `layouts.ts` already owns that word for where slides sit
// relative to each other in the 3-D overview world, which is a different problem entirely.

export const BODY_REGIONS = ['full', 'left', 'right', 'top', 'bottom'] as const
export type BodyRegion = (typeof BODY_REGIONS)[number]

/** Resolve where the body sits. A pinned slide value wins outright. Otherwise it's AUTO: derived from
 *  the slide's background image, which already half-bleeds via its own `layout` enum — so the body
 *  simply takes the half the image doesn't. That makes "paste an image and the card partitions itself"
 *  a consequence of one rule rather than a special case, and it un-partitions on its own when the
 *  image goes away. Auto only ever yields full/left/right (the image's own axis); top/bottom are
 *  reachable by pinning. */
export function resolveBodyRegion(
  pinned: string | null | undefined,
  imageLayout: BackgroundImageLayout | null | undefined,
): BodyRegion {
  if (pinned && (BODY_REGIONS as readonly string[]).includes(pinned))
    return pinned as BodyRegion
  if (imageLayout === 'left') return 'right'
  if (imageLayout === 'right') return 'left'
  return 'full'
}

// The full-bleed body's inset — the entire "safe area" concept, and the value `.strut-md` falls back to.
const PAD_Y = 64
const PAD_X = 88
// Breathing room between the body and whatever occupies the other half.
const GUTTER = 24

export interface BodyRegionStyle {
  /** A `padding` shorthand that confines the body to its region (the body box itself still fills the
   *  canvas, so nothing about stacking or `position` changes — only where its content may land). */
  pad: string
  /** Multiplier on every absolute font size in `.strut-md`. Type is sized in px against a 1280-wide
   *  canvas (h1 88px), so a half-width region would otherwise fit ~5 characters on a heading line. */
  scale: number
  /** `.strut-md`'s display. A partitioned body centres in its half ('flex' + the stylesheet's column
   *  `justify-content: safe center`); a full-bleed one stays 'block' and top-aligned — which is both
   *  what it has always done and what a canvas wants, so no existing slide moves by a pixel. */
  display: 'block' | 'flex'
}

/** The area a region visually claims, in canvas px — what the drag preview paints and where the grip
 *  sits. The inset in `bodyRegionStyle` is this rect plus the safe-area padding. */
export function bodyRegionRect(region: BodyRegion): {
  x: number
  y: number
  w: number
  h: number
} {
  const halfW = SLIDE_W / 2
  const halfH = SLIDE_H / 2
  switch (region) {
    case 'left':
      return { x: 0, y: 0, w: halfW, h: SLIDE_H }
    case 'right':
      return { x: halfW, y: 0, w: halfW, h: SLIDE_H }
    case 'top':
      return { x: 0, y: 0, w: SLIDE_W, h: halfH }
    case 'bottom':
      return { x: 0, y: halfH, w: SLIDE_W, h: halfH }
    default:
      return { x: 0, y: 0, w: SLIDE_W, h: SLIDE_H }
  }
}

// How close to the middle counts as "put it back to full-bleed". Rectangular rather than radial: the
// canvas is 16:9, so a radius would reach much further vertically than it looks like it should.
const CENTER_ZONE = 0.18

/** The region a drag lands on, from a pointer at normalized (0..1) coords within the slide. Snapping
 *  by dominant axis is the window-snap gesture — drag toward an edge, get that half; drag to the
 *  middle, get full-bleed. Pure so the feel can be tested without a browser. */
export function regionAtPoint(nx: number, ny: number): BodyRegion {
  const dx = nx - 0.5
  const dy = ny - 0.5
  if (Math.abs(dx) < CENTER_ZONE && Math.abs(dy) < CENTER_ZONE) return 'full'
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 'left' : 'right'
  return dy < 0 ? 'top' : 'bottom'
}

/** The geometry for a region: an inset + a type scale. Pure — both the app (themeVars) and the
 *  standalone export (themeVarsCss) derive their CSS vars from this one function. */
export function bodyRegionStyle(region: BodyRegion): BodyRegionStyle {
  const halfX = SLIDE_W / 2 + GUTTER
  const halfY = SLIDE_H / 2 + GUTTER
  switch (region) {
    // Width is the binding constraint on a column, so type shrinks with the measure.
    case 'left':
      return {
        pad: `${PAD_Y}px ${halfX}px ${PAD_Y}px ${PAD_X}px`,
        scale: 0.68,
        display: 'flex',
      }
    case 'right':
      return {
        pad: `${PAD_Y}px ${PAD_X}px ${PAD_Y}px ${halfX}px`,
        scale: 0.68,
        display: 'flex',
      }
    // A row keeps the full measure; height is what's scarce, so type shrinks only slightly.
    case 'top':
      return {
        pad: `${PAD_Y}px ${PAD_X}px ${halfY}px ${PAD_X}px`,
        scale: 0.85,
        display: 'flex',
      }
    case 'bottom':
      return {
        pad: `${halfY}px ${PAD_X}px ${PAD_Y}px ${PAD_X}px`,
        scale: 0.85,
        display: 'flex',
      }
    default:
      return { pad: `${PAD_Y}px ${PAD_X}px`, scale: 1, display: 'block' }
  }
}

// ---- layout: a tiling of the canvas into ordered cells --------------------------------------------
// `body_region` (above) pins the ONE markdown body to a rect; a `layout` generalizes that to N cells,
// each destined to become its own editor (phase 2). Phase 1: cell 0 hosts the existing body, so a
// full-layout ('' ) slide is byte-identical to before — nothing here runs unless a real tiling is set.
//
// Named against the screenshot's Instagram-style picker. Rects are canvas px (0..1280 × 0..720), so
// the same math positions cells on every surface. The order is reading order (top-left → bottom-right),
// which is the order cell editors will take and the camera/export will follow.

export const SLIDE_LAYOUTS = [
  '', // full — one cell, the whole canvas (default; today's single body)
  'cols-2', // two columns
  'rows-2', // two rows
  'tri', // three columns
  'grid-4', // 2×2
  'split-l', // narrow-left / wide-right (image-beside-text)
] as const
export type SlideLayout = (typeof SLIDE_LAYOUTS)[number]

/** Normalize a stored `layout` to a known preset ('' / unknown = full). */
export function resolveLayout(layout: string | null | undefined): SlideLayout {
  return (SLIDE_LAYOUTS as readonly string[]).includes(layout ?? '')
    ? ((layout ?? '') as SlideLayout)
    : ''
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const SPLIT_L_FRAC = 0.4 // the narrow column in 'split-l'

/** The ordered cell rects a layout tiles the canvas into (canvas px). Full = one whole-canvas cell. */
export function layoutCells(layout: SlideLayout): Rect[] {
  const W = SLIDE_W
  const H = SLIDE_H
  const hw = W / 2
  const hh = H / 2
  switch (layout) {
    case 'cols-2':
      return [
        { x: 0, y: 0, w: hw, h: H },
        { x: hw, y: 0, w: hw, h: H },
      ]
    case 'rows-2':
      return [
        { x: 0, y: 0, w: W, h: hh },
        { x: 0, y: hh, w: W, h: hh },
      ]
    case 'tri': {
      const tw = W / 3
      return [
        { x: 0, y: 0, w: tw, h: H },
        { x: tw, y: 0, w: tw, h: H },
        { x: 2 * tw, y: 0, w: tw, h: H },
      ]
    }
    case 'grid-4':
      return [
        { x: 0, y: 0, w: hw, h: hh },
        { x: hw, y: 0, w: hw, h: hh },
        { x: 0, y: hh, w: hw, h: hh },
        { x: hw, y: hh, w: hw, h: hh },
      ]
    case 'split-l': {
      const lw = Math.round(W * SPLIT_L_FRAC)
      return [
        { x: 0, y: 0, w: lw, h: H },
        { x: lw, y: 0, w: W - lw, h: H },
      ]
    }
    default:
      return [{ x: 0, y: 0, w: W, h: H }]
  }
}

/** The body-style (pad / type-scale / display) for a body confined to an arbitrary cell — the generic
 *  form of `bodyRegionStyle`, used for layout cells. The body element still fills the whole canvas, so
 *  the padding is what confines it: on a side that touches the canvas edge, the safe-area pad; on an
 *  interior side, the full distance to that edge PLUS a gutter (exactly what bodyRegionStyle's half/row
 *  cases compute, e.g. 'left' pads right by SLIDE_W/2 + GUTTER). Type shrinks with the cell's smaller
 *  dimension so a heading still fits the measure. Pure, so app + export derive identical CSS from it. */
export function rectBodyStyle(rect: Rect): BodyRegionStyle {
  const atLeft = rect.x <= 0
  const atTop = rect.y <= 0
  const atRight = rect.x + rect.w >= SLIDE_W
  const atBottom = rect.y + rect.h >= SLIDE_H
  if (atLeft && atTop && atRight && atBottom)
    return { pad: `${PAD_Y}px ${PAD_X}px`, scale: 1, display: 'block' }
  const left = atLeft ? PAD_X : Math.round(rect.x) + GUTTER
  const right = atRight ? PAD_X : Math.round(SLIDE_W - rect.x - rect.w) + GUTTER
  const top = atTop ? PAD_Y : Math.round(rect.y) + GUTTER
  const bottom = atBottom
    ? PAD_Y
    : Math.round(SLIDE_H - rect.y - rect.h) + GUTTER
  const wf = rect.w / SLIDE_W
  const hf = rect.h / SLIDE_H
  const scale = Math.round((0.4 + 0.6 * Math.min(wf, hf)) * 100) / 100
  return {
    pad: `${top}px ${right}px ${bottom}px ${left}px`,
    scale,
    display: 'flex',
  }
}

/** The cells this slide's body layout resolves to. A real multi-cell tiling wins; otherwise the single
 *  legacy body region (full/left/right/top/bottom + auto-image) as one cell — so `layout=''` is exactly
 *  today's behavior. Cell 0 is where the markdown body sits in phase 1. */
export function bodyCells(
  slide: SlideThemeFields | null | undefined,
  deck: DeckPresentationFields | null | undefined,
): Rect[] {
  const layout = resolveLayout(slide?.layout)
  if (layout !== '') return layoutCells(layout)
  const region = resolveBodyRegion(
    slide?.body_region,
    resolveBackgroundImage(
      slide?.background ?? undefined,
      deck?.background ?? undefined,
    )?.layout,
  )
  return [bodyRegionRect(region)]
}

/** The body-style for this slide's FIRST cell — what the single markdown body renders with. Layout
 *  tilings derive it generically; the legacy single-region path keeps its exact tuned values. */
export function bodyStyleFor(
  slide: SlideThemeFields | null | undefined,
  deck: DeckPresentationFields | null | undefined,
): BodyRegionStyle {
  const layout = resolveLayout(slide?.layout)
  if (layout !== '') return rectBodyStyle(layoutCells(layout)[0])
  return bodyRegionStyle(
    resolveBodyRegion(
      slide?.body_region,
      resolveBackgroundImage(
        slide?.background ?? undefined,
        deck?.background ?? undefined,
      )?.layout,
    ),
  )
}

/** The fully-resolved theme for one slide: deck fonts/colors (with built-in defaults) + the resolved
 *  alignment (slide override → deck → default). Fonts are family names; colors are `#rrggbb`. Both
 *  rendering modes read the same resolved theme. */
export interface ResolvedTheme {
  headingFont: string
  headingColor: string
  bodyFont: string
  bodyColor: string
  textAlign: TextAlign
}

export function resolveTheme(
  deck: DeckThemeFields | null | undefined,
  slide?: { text_align?: string | null } | null,
): ResolvedTheme {
  return {
    headingFont: deck?.heading_font || DEFAULT_FONT,
    headingColor: cssHex(deck?.heading_color ?? '', DEFAULT_TEXT_COLOR),
    bodyFont: deck?.body_font || DEFAULT_FONT,
    bodyColor: cssHex(deck?.body_color ?? '', DEFAULT_TEXT_COLOR),
    textAlign: resolveTextAlign(slide?.text_align, deck?.text_align),
  }
}

// ---- theme palette (spec §8.2) -------------------------------------------------------------------
// A curated, named hue set is the single source of truth for the deck's default color stack. Each
// hue carries BOTH the slide-card color and the deck `surface` color (the "table" the card floats
// on — a lighter sibling of the same hue). The two token records (BG_COLORS / SURFACE_COLORS) and
// the picker swatch lists all derive from it, so a card color and its surface can't drift apart and
// the picker can never offer a hue the resolver doesn't know. Values are Open Color, matching the
// text/shape swatches (COLOR_SWATCHES) so the whole palette reads as one system.
export interface ThemeHue {
  /** Stable token id: the slide-card class is `bg-<key>`, the surface class `bg-surf-<key>`. */
  key: string
  /** Human label shown in the picker. */
  name: string
  /** Slide-card background. */
  card: string
  /** Deck surface (the table behind the card) — a lighter step of the same hue. */
  surface: string
}

export const THEME_HUES: ThemeHue[] = [
  // Neutrals — the ink/paper anchors
  { key: 'ink', name: 'Ink', card: '#1e1e24', surface: '#2b2b33' },
  { key: 'white', name: 'White', card: '#ffffff', surface: '#f1f3f5' },
  { key: 'smoke', name: 'Smoke', card: '#dee2e6', surface: '#f1f3f5' },
  // Warm
  { key: 'red', name: 'Red', card: '#c92a2a', surface: '#e03131' },
  { key: 'orange', name: 'Orange', card: '#e8590c', surface: '#fd7e14' },
  { key: 'yellow', name: 'Yellow', card: '#ffd43b', surface: '#ffe066' },
  // Green
  { key: 'green', name: 'Green', card: '#2f9e44', surface: '#40c057' },
  { key: 'teal', name: 'Teal', card: '#099268', surface: '#12b886' },
  // Cool
  { key: 'blue', name: 'Blue', card: '#1971c2', surface: '#228be6' },
  { key: 'indigo', name: 'Indigo', card: '#3b5bdb', surface: '#4c6ef5' },
  { key: 'violet', name: 'Violet', card: '#6741d9', surface: '#7950f2' },
  { key: 'pink', name: 'Pink', card: '#d6336c', surface: '#e64980' },
]

// ---- background / surface resolution (spec §8.6, simplified) -------------------------------------

/** Slide-card colors: the white default plus one entry per hue, keyed `bg-<key>`. */
const BG_COLORS: Record<string, string> = {
  'bg-default': '#ffffff',
  ...Object.fromEntries(THEME_HUES.map((h) => [`bg-${h.key}`, h.card])),
}

/** Swatch tokens for the slide-background picker (excludes the always-present `bg-default`). */
export const BACKGROUND_SWATCHES = THEME_HUES.map((h) => ({
  key: `bg-${h.key}`,
  name: h.name,
}))

// Surfaces — the deck-wide outer "table" below each slide card (spec §8.2). Keyed `bg-surf-<key>`;
// no default here (`bg-default` resolves to SURFACE_DEFAULT) and no transparent (surfaces are the
// bottom layer).
const SURFACE_COLORS: Record<string, string> = Object.fromEntries(
  THEME_HUES.map((h) => [`bg-surf-${h.key}`, h.surface]),
)

export const SURFACE_SWATCHES = THEME_HUES.map((h) => ({
  key: `bg-surf-${h.key}`,
  name: h.name,
}))

// The default surface "table": a subtle radial gray (old-master `bg-default`).
const SURFACE_DEFAULT = 'radial-gradient(circle at 50% 28%, #3a3a40, #18181b)'

/** Normalize a stored hex (with or without a leading `#`) to a valid CSS color. Stored values are
 *  bare hex (`111111`), but a color picker may hand back `#111111` — tolerate both. */
export function cssHex(value: string | undefined, fallback: string): string {
  const h = (value && value.length ? value : fallback).replace(/^#+/, '')
  return '#' + (h.length ? h : fallback.replace(/^#+/, ''))
}

export const BACKGROUND_IMAGE_LAYOUTS = ['full', 'left', 'right'] as const
export type BackgroundImageLayout = (typeof BACKGROUND_IMAGE_LAYOUTS)[number]

export interface BackgroundImageSpec {
  src: string
  layout: BackgroundImageLayout
  fade: boolean
  blur: boolean
  mask: boolean
}

const DEFAULT_BG_IMAGE: Omit<BackgroundImageSpec, 'src'> = {
  layout: 'full',
  fade: false,
  blur: false,
  mask: false,
}

function effectiveThemeValue(
  value: string | undefined,
  fallback: string | undefined,
): string {
  return value && value !== '' ? value : (fallback ?? 'bg-default')
}

function validBackgroundLayout(
  value: string | null | undefined,
): BackgroundImageLayout {
  return value === 'left' || value === 'right' ? value : 'full'
}

function boolParam(value: string | null): boolean {
  return value === '1' || value === 'true'
}

export function makeBackgroundImageToken(
  src: string,
  spec: Partial<Omit<BackgroundImageSpec, 'src'>> = {},
): string {
  const trimmed = src.trim()
  if (!trimmed) return ''
  const next: BackgroundImageSpec = {
    src: trimmed,
    ...DEFAULT_BG_IMAGE,
    ...spec,
    layout: validBackgroundLayout(spec.layout),
  }
  const params = new URLSearchParams()
  params.set('src', next.src)
  if (next.layout !== 'full') params.set('layout', next.layout)
  if (next.fade) params.set('fade', '1')
  if (next.blur) params.set('blur', '1')
  if (next.mask) params.set('mask', '1')
  return `img2:${params.toString()}`
}

export function parseBackgroundImageToken(
  value: string | null | undefined,
): BackgroundImageSpec | null {
  if (!value) return null
  if (value.startsWith('img2:')) {
    const params = new URLSearchParams(value.slice('img2:'.length))
    const src = (params.get('src') ?? '').trim()
    if (!src) return null
    return {
      src,
      layout: validBackgroundLayout(params.get('layout')),
      fade: boolParam(params.get('fade')),
      blur: boolParam(params.get('blur')),
      mask: boolParam(params.get('mask')),
    }
  }
  if (value.startsWith('img:')) {
    const src = value.slice('img:'.length).trim()
    return src ? { src, ...DEFAULT_BG_IMAGE } : null
  }
  return null
}

function hasBackgroundImage(value: string | null | undefined): boolean {
  return parseBackgroundImageToken(value) !== null
}

export function resolveBackgroundImage(
  bg: string | undefined,
  fallback: string | undefined,
): BackgroundImageSpec | undefined {
  const spec = parseBackgroundImageToken(effectiveThemeValue(bg, fallback))
  return spec ?? undefined
}

export function cssUrlValue(src: string): string {
  return `url("${src.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n|\r/g, '')}")`
}

/** Resolve a slide-card background to a CSS color (or transparent). Image tokens keep the fallback
 *  color underneath when a per-slide image sits on top of a colored deck default. */
export function resolveBackground(
  slideBg: string | undefined,
  deckBg: string | undefined,
): string {
  const hasSlideValue = !!(slideBg && slideBg !== '')
  const v = effectiveThemeValue(slideBg, deckBg)
  if (v === 'bg-transparent') return 'transparent'
  if (v.startsWith('bg-custom-')) return '#' + v.slice('bg-custom-'.length)
  if (hasBackgroundImage(v))
    return hasSlideValue && deckBg && !hasBackgroundImage(deckBg)
      ? resolveBackground('', deckBg)
      : '#ffffff'
  return BG_COLORS[v] ?? '#ffffff'
}

/** Resolve the deck/slide surface (the table behind the card) to a CSS background. Per-slide value
 *  wins, else deck value; `bg-default` is the radial gray table; `bg-custom-<hex>`/`img:` handled. */
export function resolveSurface(
  slideSurface: string | undefined,
  deckSurface: string | undefined,
): string {
  const hasSlideValue = !!(slideSurface && slideSurface !== '')
  const v = effectiveThemeValue(slideSurface, deckSurface)
  if (v === 'bg-default' || v === '' || v === 'bg-transparent')
    return SURFACE_DEFAULT
  if (v.startsWith('bg-custom-')) return '#' + v.slice('bg-custom-'.length)
  if (hasBackgroundImage(v))
    return hasSlideValue && deckSurface && !hasBackgroundImage(deckSurface)
      ? resolveSurface('', deckSurface)
      : '#222222'
  return SURFACE_COLORS[v] ?? SURFACE_DEFAULT
}

export function backgroundImage(
  bg: string | undefined,
  fallback: string | undefined,
): string | undefined {
  const spec = resolveBackgroundImage(bg, fallback)
  return spec ? cssUrlValue(spec.src) : undefined
}

/** Compose a single CSS `background` shorthand from a resolved color/gradient and an optional
 *  `url(...)` image layer. Emitting ONE shorthand (rather than `background` + `backgroundImage`/
 *  `backgroundSize` longhands in the same style object) avoids React's shorthand/longhand conflict
 *  warning on every rerender — which, forwarded by the dev server's console channel, could snowball
 *  into an OOM. The image is the top layer (cover, centered), the color/gradient the base layer. */
export function composeBackground(
  color: string,
  image: string | undefined,
): string {
  return image ? `${image} center / cover no-repeat, ${color}` : color
}

// A compact swatch palette for text color & shape fill custom pickers (Open Color-ish), spec §8.5.
export const COLOR_SWATCHES = [
  '111111',
  'ffffff',
  '868e96',
  'e03131',
  'd6336c',
  '9c36b5',
  '6741d9',
  '3b5bdb',
  '1971c2',
  '0c8599',
  '099268',
  '2f9e44',
  '66a80f',
  'e8590c',
]

export function nextZ(components: readonly AnyComponent[]): number {
  return components.reduce((m, c) => Math.max(m, c.z_order), 0) + 1
}
