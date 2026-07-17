// Deck serialization — the round-trippable `.strut` JSON shape (spec §3.6) and the normalized
// structure an import produces (ids/sorts are assigned by the caller, which owns newId + fractional
// indexing + the new deck id). Pure functions; no Rindle/React deps so they can be unit-tested.

import type { AnyComponent, ComponentKind } from './types'

export interface DeckRowLike {
  id: string
  title: string
  background: string
  surface: string
  heading_font?: string | null
  heading_color?: string | null
  body_font?: string | null
  body_color?: string | null
  text_align?: string | null
  default_slide_mode?: string | null
  chosen_presenter: string
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
  markdown?: string | null
  // TipTap doc JSON (source of truth for render_mode = 'markdown'); supersedes `markdown`.
  doc?: string | null
  render_mode?: string | null
  text_align?: string | null
  body_region?: string | null
  layout?: string | null
  // Per-cell content (layout phase 2): a JSON string[] of TipTap docs for cells 1..N.
  cells?: string | null
  // Body density preset ('' | 'compact' | 'edge').
  pad?: string | null
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
  artifact: 'Artifact',
}
const TYPE_TO_KIND: Partial<Record<string, ComponentKind>> = {
  TextBox: 'text',
  Image: 'image',
  Shape: 'shape',
  Video: 'video',
  WebFrame: 'webframe',
  Artifact: 'artifact',
}

// ---- serialize (export) -------------------------------------------------------------------------

function serializeComponent(c: AnyComponent): Record<string, unknown> {
  const scale: Record<string, number> = { x: c.scale_x || 1, y: c.scale_y || 1 }
  if (c.scale_w) scale.width = c.scale_w
  if (c.scale_h) scale.height = c.scale_h
  const base: Record<string, unknown> = {
    type: KIND_TO_TYPE[c.kind],
    x: c.x,
    y: c.y,
    scale,
  }
  if (c.rotate) base.rotate = c.rotate
  if (c.skew_x) base.skewX = c.skew_x
  if (c.skew_y) base.skewY = c.skew_y
  if (c.custom_classes) base.customClasses = c.custom_classes
  switch (c.kind) {
    case 'text':
      if (c.size) base.size = c.size
      if (c.text) base.text = c.text
      // color/fontFamily omitted when '' (theme-inherited); textType only when a heading.
      if (c.color) base.color = c.color
      if (c.font_family) base.fontFamily = c.font_family
      if (c.text_type && c.text_type !== 'body') base.textType = c.text_type
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
    case 'artifact':
      // `code` is the source of truth; `src` is the built/served URL (re-derivable, but kept so an
      // imported deck renders without a rebuild round-trip).
      base.code = c.code ?? ''
      base.src = c.src ?? ''
      break
  }
  return base
}

export function serializeDeck(
  bundle: DeckBundle,
  genid = 1,
): Record<string, unknown> {
  const { deck, slides, componentsBySlide, customBackgrounds } = bundle
  return {
    fileName: deck.title || 'untitled',
    deckVersion: deck.deck_version || '1.0',
    __genid: genid,
    background: deck.background || 'bg-default',
    surface: deck.surface || 'bg-default',
    // Text theme defaults ('' = built-in default; see DeckThemeFields).
    headingFont: deck.heading_font || '',
    headingColor: deck.heading_color || '',
    bodyFont: deck.body_font || '',
    bodyColor: deck.body_color || '',
    textAlign: deck.text_align || '',
    defaultSlideMode: deck.default_slide_mode || '',
    cannedTransition: deck.canned_transition || 'none',
    customStylesheet: deck.custom_stylesheet || '',
    customBackgrounds: {
      bgs: customBackgrounds.map((b) => ({ klass: b.klass, style: b.style })),
    },
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
      // Markdown mode + per-slide alignment + a pinned body region: emitted only when set, so
      // spatial-only decks are byte-identical to before, and an auto-region slide ('') stays absent.
      // Markdown-mode content travels as the TipTap `doc` JSON.
      if (s.render_mode) slide.renderMode = s.render_mode
      if (s.doc) slide.doc = s.doc
      if (s.text_align) slide.textAlign = s.text_align
      if (s.body_region) slide.bodyRegion = s.body_region
      if (s.layout) slide.layout = s.layout
      if (s.cells) slide.cells = s.cells
      if (s.pad) slide.pad = s.pad
      return slide
    }),
  }
}

// ---- deserialize (import) -----------------------------------------------------------------------

export interface ImportedComponent {
  kind: ComponentKind
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
  text_type?: string
  src?: string
  image_type?: string
  shape?: string
  markup?: string
  fill?: string
  video_type?: string
  src_type?: string
  short_src?: string
  code?: string
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
  markdown: string
  doc: string
  render_mode: string
  text_align: string
  body_region: string
  layout: string
  cells: string
  pad: string
  components: ImportedComponent[]
}
export interface ImportedDeck {
  title: string
  background: string
  surface: string
  heading_font: string
  heading_color: string
  body_font: string
  body_color: string
  text_align: string
  default_slide_mode: string
  canned_transition: string
  custom_stylesheet: string
  deck_version: string
  customBackgrounds: CustomBgRow[]
  slides: ImportedSlide[]
}

const num = (v: unknown, d = 0): number =>
  typeof v === 'number' && isFinite(v) ? v : d
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d)

function deserializeComponent(
  raw: Record<string, unknown>,
  z: number,
): ImportedComponent | null {
  const kind = TYPE_TO_KIND[str(raw.type)]
  if (!kind) return null
  const scale = (raw.scale ?? {}) as Record<string, unknown>
  const c: ImportedComponent = {
    kind,
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
      // Missing color/fontFamily = theme-inherited. Legacy files always wrote an explicit color
      // ('111111') + family ('Lato'), so they round-trip as overrides; only a theme-authored file
      // omits them. text_type absent = body.
      c.color = str(raw.color, '')
      c.font_family = str(raw.fontFamily, '')
      c.text_type = str(raw.textType, '')
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
    case 'artifact':
      c.code = str(raw.code)
      c.src = str(raw.src)
      break
  }
  return c
}

/** Parse a `.strut` JSON object into a normalized deck. Throws if the shape is unrecognizable. */
export function deserializeDeck(json: unknown): ImportedDeck {
  if (!json || typeof json !== 'object')
    throw new Error('Not a Strut file (expected a JSON object)')
  const o = json as Record<string, unknown>
  if (!Array.isArray(o.slides))
    throw new Error('Not a Strut file (missing "slides" array)')
  const bgs = ((o.customBackgrounds as Record<string, unknown> | undefined)
    ?.bgs ?? []) as Array<Record<string, unknown>>
  return {
    title: str(o.fileName, 'Imported deck'),
    background: str(o.background, 'bg-default'),
    surface: str(o.surface, 'bg-default'),
    heading_font: str(o.headingFont),
    heading_color: str(o.headingColor),
    body_font: str(o.bodyFont),
    body_color: str(o.bodyColor),
    text_align: str(o.textAlign),
    default_slide_mode: str(o.defaultSlideMode),
    canned_transition: str(o.cannedTransition, 'none'),
    custom_stylesheet: str(o.customStylesheet),
    deck_version: str(o.deckVersion, '1.0'),
    customBackgrounds: bgs
      .map((b) => ({ klass: str(b.klass), style: str(b.style) }))
      .filter((b) => b.klass),
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
      markdown: str(s.markdown),
      doc: str(s.doc),
      render_mode: str(s.renderMode),
      text_align: str(s.textAlign),
      body_region: str(s.bodyRegion),
      layout: str(s.layout),
      cells: str(s.cells),
      pad: str(s.pad),
      components: (Array.isArray(s.components)
        ? (s.components as Array<Record<string, unknown>>)
        : []
      )
        .map((c, i) => deserializeComponent(c, i + 1))
        .filter((c): c is ImportedComponent => c !== null),
    })),
  }
}
