// The client ↔ server contract for "🎙️ From a recording" — the slide-well sibling of "✨ Generate
// slides" (shared/generate.ts). Where Generate authors slides from a short DESCRIPTION, this authors them
// from a TALK: the user drops in an audio recording (transcribed by Whisper, server/transcribe.ts) or
// pastes a transcript, and the model splits that NARRATION two ways at once —
//   • the POINTS the speaker makes in a segment → the slide's body (Markdown, like Generate), and
//   • the speaker's own WORDS for that segment → the slide's speaker notes (the `slide_notes` side table
//     that Research mode reads).
// So the deck arrives with Research/notes already populated and in sync — the thing no plain "generate"
// does. The client turns each slide's Markdown into a TipTap `doc` and appends via the ordinary
// addSlide + setSlideDoc + setSlideNotes mutations (sync, permissions, and undo come free); see
// src/editor/aiNarrate.ts.
//
// `normalizeNarrated` is the load-bearing safety primitive AND the prompt-injection firewall: whatever the
// model returns, we cap the count, cap each slide's body/notes length, and drop invalid entries. A poisoned
// transcript can at worst author some benign extra slides — one undo away. (There is no injection SINK
// either: both the body Markdown and the notes are sanitized on their way to a `doc` — see aiNarrate.ts.)

/** One model-authored slide: a Markdown body (the distilled points) plus the speaker's narration for that
 *  segment (becomes the slide's Research notes). */
export interface NarratedSlide {
  /** The slide body as Markdown: a "# Title" line, then a few concise bullets — the KEY POINTS. */
  markdown: string
  /** The speaker's words for this segment, lightly cleaned — becomes the slide's speaker notes. */
  notes: string
}

/** What the model returns and the client appends to the deck. */
export interface NarratedDeck {
  slides: NarratedSlide[]
}

/** POST body of `/api/narrate`. `targetSlides` is an OPTIONAL hint (0/undefined ⇒ the model picks a
 *  sensible number for the talk's length), bounded by NARRATE_LIMITS.maxSlides. */
export interface NarrateRequest {
  deckId: string
  transcript: string
  targetSlides?: number
}

// Server-side ceilings. Login-gating already limits callers to real accounts; these bound the per-call
// cost. `maxSlides` is the hard cap the model is asked to honor and `normalizeNarrated` enforces.
// `maxTranscript` is sized to stay well within the smallest backend's context window (Workers AI
// llama-3.3-70b-instruct-fp8-fast ≈ 24k tokens) once the echoed notes are counted against the output too —
// a longer talk is truncated (not rejected), and the paste path lets a user pre-trim. Text is truncated,
// never rejected.
export const NARRATE_LIMITS = {
  maxSlides: 40,
  maxTranscript: 24_000,
  maxMarkdownPerSlide: 2_000,
  maxNotesPerSlide: 6_000,
} as const

// Audio transcription ceilings (server/transcribe.ts). A hard byte cap on the uploaded recording — Whisper
// on Workers AI (and the Worker request body) bound how much we can transcribe in one shot; anything longer
// falls back to the paste-a-transcript path. Chunking long audio is a deliberate fast-follow, not v1.
export const TRANSCRIBE_LIMITS = {
  maxAudioBytes: 25 * 1024 * 1024,
} as const

/** What `/api/transcribe` returns: the recognized text (fed into the narrate form's transcript box). */
export interface TranscribeResult {
  text: string
}

// Coerce an untrusted value to a string — requests are parsed from JSON, so declared types are only a hope
// until we check (and it keeps the truncation below null-safe).
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

/** A clean target-slide-count hint or undefined: a positive integer within [1, maxSlides], else undefined
 *  ("let the model choose"). Tolerates strings/floats/junk from the untrusted body. */
export function clampTargetSlides(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  if (!Number.isFinite(n)) return undefined
  const i = Math.floor(n)
  if (i < 1) return undefined
  return Math.min(i, NARRATE_LIMITS.maxSlides)
}

/** Trim a request's free text to the ceilings above before it reaches the model. Pure; used server-side
 *  after auth so the model never sees an unbounded payload. */
export function clampNarrateRequest(req: NarrateRequest): NarrateRequest {
  return {
    deckId: str(req.deckId),
    transcript: str(req.transcript).slice(0, NARRATE_LIMITS.maxTranscript),
    targetSlides: clampTargetSlides(req.targetSlides),
  }
}

/** JSON schema handed to Workers AI's `response_format: { type: 'json_schema' }`. `maxItems` nudges the
 *  model to respect the cap; `normalizeNarrated` is the actual guarantee (some models honor it loosely). */
export function narrateJsonSchema() {
  return {
    type: 'object',
    properties: {
      slides: {
        type: 'array',
        minItems: 1,
        maxItems: NARRATE_LIMITS.maxSlides,
        description:
          'The slides, in the order the talk covers them. One per distinct point/section of the ' +
          'transcript; never more than 40.',
        items: {
          type: 'object',
          properties: {
            markdown: {
              type: 'string',
              description:
                'The slide body as Markdown: a single "# Title" heading line, then a few concise ' +
                'bullet points capturing the KEY POINTS the speaker makes in this segment. No HTML.',
            },
            notes: {
              type: 'string',
              description:
                "The speaker's own narration for this segment as speaker notes: their words, cleaned " +
                'of filler and repetition and lightly fixed for grammar — kept close to what they said, ' +
                'not over-summarized. Plain prose (short paragraphs).',
            },
          },
          required: ['markdown', 'notes'],
        },
      },
    },
    required: ['slides'],
  }
}

/** Validate + normalize a raw model deck against the ceilings. Guarantees:
 *  - at most `cap` slides (default NARRATE_LIMITS.maxSlides);
 *  - each `markdown` is a non-empty string, truncated to maxMarkdownPerSlide;
 *  - each `notes` is a string (possibly empty), truncated to maxNotesPerSlide;
 *  - a slide with no usable `markdown` is dropped (an empty body has nothing to render).
 *  This is the trust boundary between untrusted model output and the apply path. */
export function normalizeNarrated(
  raw: unknown,
  cap: number = NARRATE_LIMITS.maxSlides,
): NarratedDeck {
  const r = (raw ?? {}) as Record<string, unknown>
  const limit = Math.max(0, Math.min(cap, NARRATE_LIMITS.maxSlides))
  const slides: NarratedSlide[] = []
  if (Array.isArray(r.slides)) {
    for (const s of r.slides) {
      if (slides.length >= limit) break
      const ss = (s ?? {}) as Record<string, unknown>
      const md =
        typeof ss.markdown === 'string'
          ? ss.markdown.slice(0, NARRATE_LIMITS.maxMarkdownPerSlide).trim()
          : ''
      if (!md) continue
      const notes =
        typeof ss.notes === 'string'
          ? ss.notes.slice(0, NARRATE_LIMITS.maxNotesPerSlide).trim()
          : ''
      slides.push({ markdown: md, notes })
    }
  }
  return { slides }
}
