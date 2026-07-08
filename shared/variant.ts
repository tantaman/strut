// Client ↔ server contract for "Deck variants": transform a source deck digest into a new
// audience-specific deck. Like `shared/generate.ts`, this module is the trust boundary for model output:
// server code clamps inputs before inference and normalizes the JSON result before the client persists it
// through ordinary Rindle mutators.

export interface VariantSourceSlide {
  index: number
  text: string
}

export interface VariantRequest {
  sourceDeckId: string
  sourceTitle: string
  audience: string
  instructions: string
  slides: VariantSourceSlide[]
}

export interface GeneratedVariantSlide {
  markdown: string
}

export interface GeneratedVariant {
  title: string
  label: string
  slides: GeneratedVariantSlide[]
}

export const VARIANT_LIMITS = {
  maxAudience: 160,
  maxInstructions: 1200,
  maxSourceSlides: 80,
  maxSourceTextPerSlide: 1200,
  maxTitle: 140,
  maxLabel: 80,
  maxSlides: 40,
  maxMarkdownPerSlide: 4000,
} as const

const str = (v: unknown): string => (typeof v === 'string' ? v : '')

export function clampVariantRequest(req: VariantRequest): VariantRequest {
  const slides = Array.isArray(req.slides) ? req.slides : []
  return {
    sourceDeckId: str(req.sourceDeckId),
    sourceTitle: str(req.sourceTitle).slice(0, VARIANT_LIMITS.maxTitle),
    audience: str(req.audience).slice(0, VARIANT_LIMITS.maxAudience),
    instructions: str(req.instructions).slice(
      0,
      VARIANT_LIMITS.maxInstructions,
    ),
    slides: slides.slice(0, VARIANT_LIMITS.maxSourceSlides).map((s, i) => ({
      index:
        typeof s.index === 'number' && Number.isFinite(s.index)
          ? Math.max(1, Math.floor(s.index))
          : i + 1,
      text: str(s.text).slice(0, VARIANT_LIMITS.maxSourceTextPerSlide),
    })),
  }
}

export function variantJsonSchema() {
  return {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description:
          'A concise title for the new variant deck, usually based on the source title and audience.',
      },
      label: {
        type: 'string',
        description:
          'A short audience/purpose label, such as "Executive brief" or "Technical deep dive".',
      },
      slides: {
        type: 'array',
        minItems: 1,
        maxItems: VARIANT_LIMITS.maxSlides,
        description:
          'The generated variant slides, in presentation order. Choose the right length for the ' +
          'audience and instructions, never more than 40 slides.',
        items: {
          type: 'object',
          properties: {
            markdown: {
              type: 'string',
              description:
                'The slide content as Markdown: a single "# Title" heading line, then concise ' +
                'bullets or one short paragraph. No HTML.',
            },
          },
          required: ['markdown'],
        },
      },
    },
    required: ['title', 'label', 'slides'],
  }
}

export function normalizeGeneratedVariant(raw: unknown): GeneratedVariant {
  const r = (raw ?? {}) as Record<string, unknown>
  const title = str(r.title).slice(0, VARIANT_LIMITS.maxTitle).trim()
  const label = str(r.label).slice(0, VARIANT_LIMITS.maxLabel).trim()
  const slides: GeneratedVariantSlide[] = []
  if (Array.isArray(r.slides)) {
    for (const s of r.slides) {
      if (slides.length >= VARIANT_LIMITS.maxSlides) break
      const ss = (s ?? {}) as Record<string, unknown>
      const markdown = str(ss.markdown)
        .slice(0, VARIANT_LIMITS.maxMarkdownPerSlide)
        .trim()
      if (markdown) slides.push({ markdown })
    }
  }
  return { title, label, slides }
}
