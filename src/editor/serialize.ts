// Deck serialization — the round-trippable `.strut` JSON shape (spec §3.6) and the normalized
// structure an import produces (ids/sorts are assigned by the caller, which owns newId + fractional
// indexing + the new deck id). Pure functions; no Rindle/React deps so they can be unit-tested.

import type { AnyComponent, ComponentKind } from './types'
import { KIND_TO_TABLE } from './types'

export interface DeckRowLike {
  id: string
  title: string
  background: string
  surface: string
  canned_transition: string
  custom_stylesheet: string
  deck_version: string
}
export interface SlideRowLike {
  id: string
  x: number
  y: number
  z: number
  rotate_x: number
  rotate_y: number
  rotate_z: number
  imp_scale: number
  background: string
  surface: string
}
export interface CustomBgRow {
  klass: string
  style: string
}

/** Everything needed to serialize a deck — gathered from the store (see gatherDeckBundle). */
export interface DeckBundle {
  deck: DeckRowLike
  slides: SlideRowLike[]
  componentsBySlide: Record<string, AnyComponent[]>
  customBackgrounds: CustomBgRow[]
}

const KIND_TO_TYPE: Record<ComponentKind, string> = {
  text: 'TextBox',
  image: 'Image',
  shape: 'Shape',
  video: 'Video',
  webframe: 'WebFrame',
}
const TYPE_TO_KIND: Record<string, ComponentKind> = {
  TextBox: 'text',
  Image: 'image',
  Shape: 'shape',
  Video: 'video',
  WebFrame: 'webframe',
}

// ---- serialize (export) -------------------------------------------------------------------------

function serializeComponent(c: AnyComponent): Record<string, unknown> {
  const scale: Record<string, number> = { x: c.scale_x || 1, y: c.scale_y || 1 }
  if (c.scale_w) scale.width = c.scale_w
  if (c.scale_h) scale.height = c.scale_h
  const base: Record<string, unknown> = { type: KIND_TO_TYPE[c.kind], x: c.x, y: c.y, scale }
  if (c.rotate) base.rotate = c.rotate
  if (c.skew_x) base.skewX = c.skew_x
  if (c.skew_y) base.skewY = c.skew_y
  if (c.custom_classes) base.customClasses = c.custom_classes
  switch (c.kind) {
    case 'text':
      if (c.size) base.size = c.size
      if (c.text) base.text = c.text
      if (c.color) base.color = c.color
      if (c.font_family) base.fontFamily = c.font_family
      break
    case 'image':
      base.src = c.src ?? ''
      if (c.image_type) base.imageType = c.image_type
      break
    case 'shape':
      base.fill = c.fill ?? '3498db'
      base.markup = c.markup ?? ''
      if (c.shape) base.shape = c.shape
      break
    case 'video':
      base.src = c.src ?? ''
      if (c.short_src) base.shortSrc = c.short_src
      if (c.video_type) base.videoType = c.video_type
      if (c.src_type) base.srcType = c.src_type
      break
    case 'webframe':
      base.src = c.src ?? ''
      break
  }
  return base
}

export function serializeDeck(bundle: DeckBundle, genid = 1): Record<string, unknown> {
  const { deck, slides, componentsBySlide, customBackgrounds } = bundle
  return {
    fileName: deck.title || 'untitled',
    deckVersion: deck.deck_version || '1.0',
    __genid: genid,
    background: deck.background || 'bg-default',
    surface: deck.surface || 'bg-default',
    cannedTransition: deck.canned_transition || 'none',
    customStylesheet: deck.custom_stylesheet || '',
    customBackgrounds: { bgs: customBackgrounds.map((b) => ({ klass: b.klass, style: b.style })) },
    slides: slides.map((s, index) => {
      const slide: Record<string, unknown> = {
        type: 'slide',
        index,
        x: s.x,
        y: s.y,
        z: s.z,
        impScale: s.imp_scale,
        rotateX: s.rotate_x,
        rotateY: s.rotate_y,
        rotateZ: s.rotate_z,
        background: s.background || '',
        surface: s.surface || '',
        components: (componentsBySlide[s.id] ?? []).map(serializeComponent),
      }
      return slide
    }),
  }
}

// ---- deserialize (import) -----------------------------------------------------------------------

export interface ImportedComponent {
  kind: ComponentKind
  table: AnyComponent['table']
  x: number
  y: number
  z_order: number
  scale_x: number
  scale_y: number
  scale_w: number
  scale_h: number
  rotate: number
  skew_x: number
  skew_y: number
  custom_classes: string
  text?: string
  size?: number
  color?: string
  font_family?: string
  src?: string
  image_type?: string
  shape?: string
  markup?: string
  fill?: string
  video_type?: string
  src_type?: string
  short_src?: string
}
export interface ImportedSlide {
  x: number
  y: number
  z: number
  rotate_x: number
  rotate_y: number
  rotate_z: number
  imp_scale: number
  background: string
  surface: string
  components: ImportedComponent[]
}
export interface ImportedDeck {
  title: string
  background: string
  surface: string
  canned_transition: string
  custom_stylesheet: string
  deck_version: string
  customBackgrounds: CustomBgRow[]
  slides: ImportedSlide[]
}

const num = (v: unknown, d = 0): number => (typeof v === 'number' && isFinite(v) ? v : d)
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d)

function deserializeComponent(raw: Record<string, unknown>, z: number): ImportedComponent | null {
  const kind = TYPE_TO_KIND[str(raw.type)]
  if (!kind) return null
  const scale = (raw.scale ?? {}) as Record<string, unknown>
  const c: ImportedComponent = {
    kind,
    table: KIND_TO_TABLE[kind],
    x: num(raw.x),
    y: num(raw.y),
    z_order: z,
    scale_x: num(scale.x, 1),
    scale_y: num(scale.y, 1),
    scale_w: num(scale.width, 0),
    scale_h: num(scale.height, 0),
    rotate: num(raw.rotate),
    skew_x: num(raw.skewX),
    skew_y: num(raw.skewY),
    custom_classes: str(raw.customClasses),
  }
  switch (kind) {
    case 'text':
      c.text = str(raw.text, 'Text')
      c.size = num(raw.size, 72)
      c.color = str(raw.color, '111111')
      c.font_family = str(raw.fontFamily, 'Lato')
      break
    case 'image':
      // legacy {docKey,attachKey} attachments aren't supported (no bytes in JSON) — keep string srcs.
      c.src = typeof raw.src === 'string' ? raw.src : ''
      c.image_type = str(raw.imageType)
      break
    case 'shape':
      c.shape = str(raw.shape, 'square')
      c.markup = str(raw.markup)
      c.fill = str(raw.fill, '3498db')
      break
    case 'video':
      c.src = str(raw.src)
      c.video_type = str(raw.videoType, 'html5')
      c.src_type = str(raw.srcType)
      c.short_src = str(raw.shortSrc)
      break
    case 'webframe':
      c.src = str(raw.src)
      break
  }
  return c
}

/** Parse a `.strut` JSON object into a normalized deck. Throws if the shape is unrecognizable. */
export function deserializeDeck(json: unknown): ImportedDeck {
  if (!json || typeof json !== 'object') throw new Error('Not a Strut file (expected a JSON object)')
  const o = json as Record<string, unknown>
  if (!Array.isArray(o.slides)) throw new Error('Not a Strut file (missing "slides" array)')
  const bgs = ((o.customBackgrounds as Record<string, unknown> | undefined)?.bgs ?? []) as Array<Record<string, unknown>>
  return {
    title: str(o.fileName, 'Imported deck'),
    background: str(o.background, 'bg-default'),
    surface: str(o.surface, 'bg-default'),
    canned_transition: str(o.cannedTransition, 'none'),
    custom_stylesheet: str(o.customStylesheet),
    deck_version: str(o.deckVersion, '1.0'),
    customBackgrounds: bgs.map((b) => ({ klass: str(b.klass), style: str(b.style) })).filter((b) => b.klass),
    slides: (o.slides as Array<Record<string, unknown>>).map((s) => ({
      x: num(s.x),
      y: num(s.y),
      z: num(s.z),
      rotate_x: num(s.rotateX),
      rotate_y: num(s.rotateY),
      rotate_z: num(s.rotateZ),
      imp_scale: num(s.impScale, 3),
      background: str(s.background),
      surface: str(s.surface),
      components: (Array.isArray(s.components) ? (s.components as Array<Record<string, unknown>>) : [])
        .map((c, i) => deserializeComponent(c, i + 1))
        .filter((c): c is ImportedComponent => c !== null),
    })),
  }
}
