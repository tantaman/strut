// Shared editor types: a unified "component" view over the polymorphic Rindle `component` table,
// plus the shape catalog and theme-resolution helpers.

import { parseProps } from '../../shared/componentProps'
import type { ComponentProps, ComponentType } from '../../shared/componentProps'
import { DEFAULT_FONT } from '../config'

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

// ---- shape catalog (subset of spec §6; currentColor lets `fill` drive the color) ----------------

export const SHAPES: Record<string, string> = {
  square: `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><rect width="100" height="100" fill="currentColor"/></svg>`,
  circle: `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><ellipse cx="50" cy="50" rx="50" ry="50" fill="currentColor"/></svg>`,
  triangle: `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="50,2 98,98 2,98" fill="currentColor"/></svg>`,
  hexagon: `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="25,3 75,3 100,50 75,97 25,97 0,50" fill="currentColor"/></svg>`,
  pentagon: `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="50,2 98,38 79,97 21,97 2,38" fill="currentColor"/></svg>`,
  star: `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="50,2 61,38 98,38 68,60 79,96 50,74 21,96 32,60 2,38 39,38" fill="currentColor"/></svg>`,
  heart: `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M50,88 L12,50 A20,20 0 0 1 50,24 A20,20 0 0 1 88,50 Z" fill="currentColor"/></svg>`,
}

export const SHAPE_NAMES = Object.keys(SHAPES)

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

/** Resolve a slide-card background to a CSS color (or transparent). `bg-custom-<hex>` and `img:` are
 *  handled too. Per-slide value wins, else deck value. */
export function resolveBackground(
  slideBg: string | undefined,
  deckBg: string | undefined,
): string {
  const v = slideBg && slideBg !== '' ? slideBg : (deckBg ?? 'bg-default')
  if (v === 'bg-transparent') return 'transparent'
  if (v.startsWith('bg-custom-')) return '#' + v.slice('bg-custom-'.length)
  if (v.startsWith('img:')) return '#ffffff'
  return BG_COLORS[v] ?? '#ffffff'
}

/** Resolve the deck/slide surface (the table behind the card) to a CSS background. Per-slide value
 *  wins, else deck value; `bg-default` is the radial gray table; `bg-custom-<hex>`/`img:` handled. */
export function resolveSurface(
  slideSurface: string | undefined,
  deckSurface: string | undefined,
): string {
  const v =
    slideSurface && slideSurface !== ''
      ? slideSurface
      : (deckSurface ?? 'bg-default')
  if (v === 'bg-default' || v === '' || v === 'bg-transparent')
    return SURFACE_DEFAULT
  if (v.startsWith('bg-custom-')) return '#' + v.slice('bg-custom-'.length)
  if (v.startsWith('img:')) return '#222222'
  return SURFACE_COLORS[v] ?? SURFACE_DEFAULT
}

export function backgroundImage(
  bg: string | undefined,
  fallback: string | undefined,
): string | undefined {
  const v = bg && bg !== '' ? bg : (fallback ?? 'bg-default')
  return v.startsWith('img:') ? `url(${v.slice(4)})` : undefined
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
