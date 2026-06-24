// Shared editor types: a unified "component" view over the five per-type Rindle tables, plus the
// shape catalog and theme-resolution helpers.

import type { ComponentTable } from '../../shared/app-def'

export type ComponentKind = 'text' | 'image' | 'shape' | 'video' | 'webframe'

export const KIND_TO_TABLE: Record<ComponentKind, ComponentTable> = {
  text: 'text_component',
  image: 'image_component',
  shape: 'shape_component',
  video: 'video_component',
  webframe: 'webframe_component',
}

/** Spatial base shared by every component table. */
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

export type AnyComponent = SpatialBase & {
  kind: ComponentKind
  table: ComponentTable
  // text
  text?: string
  size?: number
  color?: string
  font_family?: string
  // image
  src?: string
  image_type?: string
  // shape
  shape?: string
  markup?: string
  fill?: string
  // video
  video_type?: string
  src_type?: string
  short_src?: string
}

function tag<T extends SpatialBase>(rows: readonly T[], kind: ComponentKind): AnyComponent[] {
  return rows.map((r) => ({ ...r, kind, table: KIND_TO_TABLE[kind] }) as AnyComponent)
}

export function mergeComponents(
  texts: readonly SpatialBase[],
  images: readonly SpatialBase[],
  shapes: readonly SpatialBase[],
  videos: readonly SpatialBase[],
  webframes: readonly SpatialBase[],
): AnyComponent[] {
  return [
    ...tag(texts, 'text'),
    ...tag(images, 'image'),
    ...tag(shapes, 'shape'),
    ...tag(videos, 'video'),
    ...tag(webframes, 'webframe'),
  ].sort((a, b) => a.z_order - b.z_order)
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

// ---- background / surface resolution (spec §8.6, simplified) -------------------------------------

const BG_COLORS: Record<string, string> = {
  'bg-default': '#ffffff',
  'bg-black': '#222222',
  'bg-light': '#ffffff',
  'bg-smoke': '#dddddd',
  'bg-orange': '#774040',
  'bg-yellow': '#d1b377',
  'bg-grass': '#597847',
  'bg-darkgreen': '#134952',
  'bg-sky': '#515e99',
  'bg-lavender': '#443c4d',
  'bg-purple': '#6c478f',
  'bg-salmon': '#c98d8d',
}

export const BACKGROUND_SWATCHES = Object.keys(BG_COLORS).filter((k) => k !== 'bg-default')

// Surfaces — the deck-wide outer "table" below each slide card (spec §8.2). Flat (gradients shipped
// flat in old-master). No transparent (surfaces are the bottom layer).
const SURFACE_COLORS: Record<string, string> = {
  'bg-surf-grad-black': '#333333',
  'bg-surf-grad-light': '#ffffff',
  'bg-surf-grad-smoke': '#eeeeee',
  'bg-surf-grad-orange': '#945353',
  'bg-surf-grad-yellow': '#cfb98c',
  'bg-surf-grad-grass': '#6c855d',
  'bg-surf-grad-darkgreen': '#4a939e',
  'bg-surf-grad-sky': '#5e699c',
  'bg-surf-grad-lavender': '#554b61',
  'bg-surf-grad-purple': '#775796',
  'bg-surf-grad-salmon': '#cfa2a2',
}

export const SURFACE_SWATCHES = Object.keys(SURFACE_COLORS)

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
  const v = slideSurface && slideSurface !== '' ? slideSurface : (deckSurface ?? 'bg-default')
  if (v === 'bg-default' || v === '' || v === 'bg-transparent') return SURFACE_DEFAULT
  if (v.startsWith('bg-custom-')) return '#' + v.slice('bg-custom-'.length)
  if (v.startsWith('img:')) return '#222222'
  return SURFACE_COLORS[v] ?? SURFACE_DEFAULT
}

export function backgroundImage(bg: string | undefined, fallback: string | undefined): string | undefined {
  const v = bg && bg !== '' ? bg : (fallback ?? 'bg-default')
  return v.startsWith('img:') ? `url(${v.slice(4)})` : undefined
}

// A compact swatch palette for text color & shape fill custom pickers (Open Color-ish), spec §8.5.
export const COLOR_SWATCHES = [
  '111111', 'ffffff', '868e96', 'e03131', 'd6336c', '9c36b5', '6741d9',
  '3b5bdb', '1971c2', '0c8599', '099268', '2f9e44', '66a80f', 'e8590c',
]

export function nextZ(components: readonly AnyComponent[]): number {
  return components.reduce((m, c) => Math.max(m, c.z_order), 0) + 1
}
