// The `component.props` payload — the single source of truth for the type-specific leaf shape.
// `props` is now a TYPED JSON column (json<ComponentProps>(), refined in shared/app-def.ts): the
// engine stores/serializes the object on the wire and hands it back parsed on read, so there is no
// hand-rolled string codec anymore. Because the ISOMORPHIC mutator body runs the SAME code on both
// tiers, the client's optimistic row and the server's authoritative row are built identically (no
// byte-order concern — that was the old string codec's job). Geometry, z-order, custom_classes and
// `fill` are real columns; everything below lives in `props`.

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

// Build the props object for a given type. Reads only the keys that type owns (undefined keys are
// dropped by the object spread on read), so the stored payload stays minimal — the object twin of the
// old `serializeProps`, minus the JSON.stringify (the json<ComponentProps>() column serializes it).
export function componentProps(
  type: ComponentType,
  a: Partial<Record<keyof ComponentProps, unknown>>,
): ComponentProps {
  switch (type) {
    case 'text':
      return {
        text: a.text as string | undefined,
        size: a.size as number | undefined,
        color: a.color as string | undefined,
        font_family: a.font_family as string | undefined,
        text_type: a.text_type as string | undefined,
      }
    case 'image':
      return { src: a.src as string | undefined, image_type: a.image_type as string | undefined }
    case 'shape':
      return { shape: a.shape as string | undefined, markup: a.markup as string | undefined }
    case 'video':
      return {
        src: a.src as string | undefined,
        video_type: a.video_type as string | undefined,
        src_type: a.src_type as string | undefined,
        short_src: a.short_src as string | undefined,
      }
    case 'webframe':
      return { src: a.src as string | undefined }
  }
}

/** Read a stored `props` value into a ComponentProps. With the json column it's already an object;
 *  tolerant of a legacy JSON string and null/garbage (returns `{}`) so a malformed row can't crash a
 *  render. */
export function parseProps(v: unknown): ComponentProps {
  if (!v) return {}
  if (typeof v === 'object') return v as ComponentProps
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v)
      return parsed && typeof parsed === 'object' ? (parsed as ComponentProps) : {}
    } catch {
      return {}
    }
  }
  return {}
}
