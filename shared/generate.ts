// The client ↔ server contract for "✨ Generate slides" — the slide-well analogue of AI Arrange
// (shared/arrange.ts). Where Arrange REORDERS existing slides, Generate AUTHORS new ones: a
// natural-language description → a small set of slides, each a chunk of Markdown (a `# title` + a few
// bullets or a short paragraph). The client turns that Markdown into a TipTap `doc` and appends the
// slides via the ordinary `addSlide` + `setSlideDoc` mutations (so sync, permissions, and undo come
// free), exactly like Arrange rides `reorderSlide`/`setSlideTransform`.
//
// `normalizeGenerated` is the load-bearing safety primitive AND the prompt-injection firewall: whatever
// the model returns, we cap the count, cap each slide's length, and drop non-string/empty entries. The
// worst a poisoned description can do is author some benign extra slides — one undo away. (There is no
// injection SINK either: the Markdown is sanitized on its way to a `doc`, see src/editor/aiGenerate.ts.)

/** One model-authored slide: a chunk of Markdown that becomes the slide's body (a markdown-mode `doc`). */
export interface GeneratedSlide {
  markdown: string
}

/** What the model returns and the client appends to the deck. */
export interface GeneratedDeck {
  slides: GeneratedSlide[]
}

/** POST body of `/api/generate`. The count is NOT a field — the author states it in `prompt` ("6 slides
 *  about …") and the model infers it, bounded by GENERATE_LIMITS.maxSlides. */
export interface GenerateRequest {
  deckId: string
  prompt: string
}

// Server-side ceilings. Login-gating already limits callers to real accounts; these bound the per-call
// cost. `maxSlides` is the hard cap the model is asked to honor and `normalizeGenerated` enforces — one
// call can never balloon the deck. Text is truncated (not rejected). Sized to stay well under the
// model's context window (llama-3.3-70b-instruct-fp8-fast ≈ 24k tokens).
export const GENERATE_LIMITS = {
  maxSlides: 15,
  maxPrompt: 2000,
  maxMarkdownPerSlide: 4000,
} as const

// Coerce an untrusted value to a string — the request is parsed from JSON, so the declared types are
// only a hope until we check (and it keeps the truncation below null-safe).
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

/** Trim a request's free text to the ceilings above before it reaches the model. Pure; used server-side
 *  after auth so the model never sees an unbounded payload. */
export function clampGenerateRequest(req: GenerateRequest): GenerateRequest {
  return {
    deckId: str(req.deckId),
    prompt: str(req.prompt).slice(0, GENERATE_LIMITS.maxPrompt),
  }
}

/** JSON schema handed to Workers AI's `response_format: { type: 'json_schema' }`. `maxItems` nudges the
 *  model to respect the cap; `normalizeGenerated` is the actual guarantee (some models honor it loosely). */
export function generateJsonSchema() {
  return {
    type: 'object',
    properties: {
      slides: {
        type: 'array',
        minItems: 1,
        maxItems: GENERATE_LIMITS.maxSlides,
        description:
          'The generated slides, in presentation order. Produce the number the author asked for ' +
          '(never more than 15); if they did not say, choose a sensible number for the topic.',
        items: {
          type: 'object',
          properties: {
            markdown: {
              type: 'string',
              description:
                'The slide content as Markdown: a single "# Title" heading line, then a few concise ' +
                'bullet points or one short paragraph. No HTML.',
            },
          },
          required: ['markdown'],
        },
      },
    },
    required: ['slides'],
  }
}

/** Validate + normalize a raw model deck against the ceilings. Guarantees:
 *  - at most `cap` slides (default GENERATE_LIMITS.maxSlides);
 *  - each `markdown` is a non-empty string, truncated to maxMarkdownPerSlide;
 *  - non-string / empty entries dropped.
 *  This is the trust boundary between untrusted model output and the apply path. */
export function normalizeGenerated(
  raw: unknown,
  cap: number = GENERATE_LIMITS.maxSlides,
): GeneratedDeck {
  const r = (raw ?? {}) as Record<string, unknown>
  const limit = Math.max(0, Math.min(cap, GENERATE_LIMITS.maxSlides))
  const slides: GeneratedSlide[] = []
  if (Array.isArray(r.slides)) {
    for (const s of r.slides) {
      if (slides.length >= limit) break
      const ss = (s ?? {}) as Record<string, unknown>
      const md =
        typeof ss.markdown === 'string'
          ? ss.markdown.slice(0, GENERATE_LIMITS.maxMarkdownPerSlide).trim()
          : ''
      if (md) slides.push({ markdown: md })
    }
  }
  return { slides }
}
