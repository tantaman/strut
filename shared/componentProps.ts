// The `component.props` JSON codec — the single source of truth for the type-specific payload shape,
// shared by BOTH tiers so the client's optimistic row and the server's authoritative row serialize
// byte-identically (same key order → no spurious diff on rebase). Geometry, z-order, custom_classes
// and `fill` are real columns; everything below lives in `props` (a JSON string on the wire today —
// swap this codec for a `json<ComponentProps>()` column once Rindle types JSON columns).

export type ComponentType = 'text' | 'image' | 'shape' | 'video' | 'webframe'

export const COMPONENT_TYPES: readonly ComponentType[] = [
  'text',
  'image',
  'shape',
  'video',
  'webframe',
]

// The per-type leaf payload. `fill` is intentionally NOT here (it's a column). Fields are optional so
// a parsed blob spreads cleanly onto the flat in-memory component (see src/editor/types.ts).
export type ComponentProps = Partial<{
  // text — color/font_family may be '' meaning "inherit the deck theme default for text_type";
  // text_type is 'heading' | 'body' ('' / absent = body, so legacy rows need no backfill).
  text: string
  size: number
  color: string
  font_family: string
  text_type: string
  // image
  image_type: string
  // shape
  shape: string
  markup: string
  // video
  video_type: string
  src_type: string
  short_src: string
  // image / video / webframe
  src: string
}>

// Serialize the props blob for a given type. Reads only the keys that type owns, in a fixed order, so
// both tiers produce the same string. Anything the caller doesn't supply is dropped (undefined keys
// are omitted by JSON.stringify), matching the old per-type INSERTs.
export function serializeProps(
  type: ComponentType,
  a: Partial<Record<keyof ComponentProps, unknown>>,
): string {
  switch (type) {
    case 'text':
      return JSON.stringify({
        text: a.text,
        size: a.size,
        color: a.color,
        font_family: a.font_family,
        text_type: a.text_type,
      })
    case 'image':
      return JSON.stringify({ src: a.src, image_type: a.image_type })
    case 'shape':
      return JSON.stringify({ shape: a.shape, markup: a.markup })
    case 'video':
      return JSON.stringify({
        src: a.src,
        video_type: a.video_type,
        src_type: a.src_type,
        short_src: a.short_src,
      })
    case 'webframe':
      return JSON.stringify({ src: a.src })
  }
}

/** Parse a stored `props` blob. Tolerates null/empty/garbage (returns `{}`) so a malformed row can't
 *  crash a render. */
export function parseProps(json: string | null | undefined): ComponentProps {
  if (!json) return {}
  try {
    const v = JSON.parse(json)
    return v && typeof v === 'object' ? (v as ComponentProps) : {}
  } catch {
    return {}
  }
}
