// The client ↔ server contract for "✨ AI Arrange" — connect a model and let it set the reading/camera
// order + pick a spatial layout for the Overview from a natural-language instruction (see
// AI_ARRANGE_PLAN.md). The model is JUST ANOTHER PRODUCER of the two mutations a human drag already
// makes: `reorderSlide` (reading order) and `setSlideTransform` via a layout preset. It emits SEMANTICS
// (an id permutation + a preset name), never raw geometry — geometry stays deterministic in
// `src/editor/layouts.ts`.
//
// `normalizePlan` is the load-bearing safety primitive AND the prompt-injection firewall: whatever the
// model returns, we force `order` to be a permutation of the deck's OWN slide ids and clamp `layout` to
// a known preset. The worst a poisoned slide text can do is yield a benign reordering of the user's own
// slides — which is one undo away — never an arbitrary mutation.

// Layout presets the model may choose, bound to the real ids in `src/editor/layouts.ts` (LAYOUTS) plus
// `keep` = "don't touch spatial positions, only the reading order". Keep this list in sync with LAYOUTS.
export const LAYOUT_PRESETS = [
  'keep',
  'grid',
  'line',
  'circle',
  'coverflow',
  'scatter',
] as const
export type LayoutPreset = (typeof LAYOUT_PRESETS)[number]

/** One slide reduced to what the model needs to reason about ordering — never geometry, never ids of
 *  other users' data. Built on the client from the already-materialized deck (no server re-read). */
export interface SlideDigest {
  id: string
  title: string
  text: string
}

/** POST body of `/api/arrange`. The client sends the digest it already has rendered; the server caps it
 *  (ARRANGE_LIMITS) so a client can't inflate the payload to burn the app's inference budget. */
export interface ArrangeRequest {
  deckId: string
  instruction: string
  slides: SlideDigest[]
}

/** What the model proposes and the client previews. `order` is authoritative (always a full permutation
 *  after `normalizePlan`); the rest are hints for the preview + apply. */
export interface ArrangementPlan {
  /** Slide ids in desired reading/camera order → `keysBetween` → one `reorderSlide` per slide. */
  order: string[]
  /** Optional semantic clusters the model saw — shown in the preview; not required to apply. */
  groups?: { label: string; slideIds: string[] }[]
  /** Which spatial preset to lay the cards out in ('keep' leaves positions untouched). */
  layout: LayoutPreset
  /** Short human-readable "why", shown above the preview. */
  rationale?: string
}

// Server-side ceilings. Login-gating already limits callers to real accounts; these bound the per-call
// cost on top of that. Text is truncated (not rejected) so a big deck still works. Sized to stay well
// under the arrange model's context window (llama-3.3-70b-instruct-fp8-fast ≈ 24k tokens): a full
// 150-slide deck at these caps is roughly (120+240 chars)·150 + ids ≈ 15k tokens of prompt.
export const ARRANGE_LIMITS = {
  maxSlides: 150,
  maxInstruction: 600,
  maxTitle: 120,
  maxTextPerSlide: 240,
} as const

// Coerce an untrusted value to a string — the request is parsed from JSON, so the declared types are
// only a hope until we check (and it keeps the truncation below null-safe).
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

/** Trim a request's free text to the ceilings above before it reaches the model. Pure; used server-side
 *  after auth so the model never sees an unbounded payload. */
export function clampRequest(req: ArrangeRequest): ArrangeRequest {
  return {
    deckId: str(req.deckId),
    instruction: str(req.instruction).slice(0, ARRANGE_LIMITS.maxInstruction),
    slides: req.slides.slice(0, ARRANGE_LIMITS.maxSlides).map((s) => ({
      id: str(s.id),
      title: str(s.title).slice(0, ARRANGE_LIMITS.maxTitle),
      text: str(s.text).slice(0, ARRANGE_LIMITS.maxTextPerSlide),
    })),
  }
}

/** JSON schema handed to Workers AI's `response_format: { type: 'json_schema' }`. Constraining `order`'s
 *  items to `enum: slideIds` nudges the model to emit only real ids; `normalizePlan` is the actual
 *  guarantee (some models honor the enum loosely). */
export function arrangeJsonSchema(slideIds: string[]) {
  const slideIdEnum = { type: 'string', enum: slideIds } as const
  return {
    type: 'object',
    properties: {
      order: {
        type: 'array',
        description: 'All slide ids, in the desired reading/camera order.',
        items: slideIdEnum,
      },
      layout: {
        type: 'string',
        enum: [...LAYOUT_PRESETS],
        description:
          'Spatial layout preset for the overview cards. Use "keep" to leave positions unchanged.',
      },
      groups: {
        type: 'array',
        description: 'Optional semantic clusters of slides.',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            slideIds: { type: 'array', items: slideIdEnum },
          },
          required: ['label', 'slideIds'],
        },
      },
      rationale: {
        type: 'string',
        description: 'One or two sentences explaining the arrangement.',
      },
    },
    required: ['order'],
  }
}

const PRESETS = new Set<string>(LAYOUT_PRESETS)

/** Validate + normalize a raw model plan against the deck's ACTUAL slide ids. Guarantees:
 *  - `order` is a full permutation of `deckIds` (unknown/duplicate ids dropped; any omitted deck slides
 *    appended in their original order, so nothing is lost);
 *  - `layout` is a known preset (else 'keep');
 *  - `groups` only reference real ids; empty groups dropped.
 *  This is the trust boundary between untrusted model output and the apply path. */
export function normalizePlan(
  raw: unknown,
  deckIds: string[],
): ArrangementPlan {
  const r = (raw ?? {}) as Record<string, unknown>
  const known = new Set(deckIds)

  const seen = new Set<string>()
  const order: string[] = []
  if (Array.isArray(r.order)) {
    for (const id of r.order) {
      if (typeof id === 'string' && known.has(id) && !seen.has(id)) {
        seen.add(id)
        order.push(id)
      }
    }
  }
  // Append any deck slide the model omitted, preserving the deck's own order — `order` is now a
  // complete permutation, so the apply path can re-key every slide.
  for (const id of deckIds) if (!seen.has(id)) order.push(id)

  const layout: LayoutPreset =
    typeof r.layout === 'string' && PRESETS.has(r.layout)
      ? (r.layout as LayoutPreset)
      : 'keep'

  let groups: ArrangementPlan['groups']
  if (Array.isArray(r.groups)) {
    groups = r.groups
      .map((g) => {
        const gg = (g ?? {}) as Record<string, unknown>
        const slideIds = Array.isArray(gg.slideIds)
          ? gg.slideIds.filter(
              (id): id is string => typeof id === 'string' && known.has(id),
            )
          : []
        return {
          label: typeof gg.label === 'string' ? gg.label.slice(0, 80) : '',
          slideIds,
        }
      })
      .filter((g) => g.slideIds.length > 0)
    if (groups.length === 0) groups = undefined
  }

  const rationale =
    typeof r.rationale === 'string' ? r.rationale.slice(0, 600) : undefined

  return { order, layout, groups, rationale }
}
