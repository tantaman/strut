// The client ↔ server contract for "✨ AI Arrange" — connect a model and let it set the reading/camera
// order + pick a spatial layout for the Overview from a natural-language instruction. The model is
// JUST ANOTHER PRODUCER of the two mutations a human drag already
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

/** A raw per-slide geometry override the model may author (freeform placement). Every field is OPTIONAL
 *  and layered on top of the chosen `layout` preset (or on the slide's current transform when
 *  `layout: 'keep'`) — so the model can nudge one card or hand-place them all. `normalizePlan` is the
 *  trust boundary: it drops unknown ids and CLAMPS every axis (see PLACEMENT_BOUNDS), so a poisoned plan
 *  can't fling a card off-camera. Positions are in overview "card units" (origin = centre, +x right,
 *  +y down; a card is ~240 wide). Rotations are stored in RADIANS here — the model-facing JSON schema
 *  asks for degrees and `normalizePlan` converts at the boundary, so downstream matches LayoutTransform. */
export interface SlidePlacement {
  id: string
  x?: number
  y?: number
  z?: number
  rotate_x?: number
  rotate_y?: number
  rotate_z?: number
  imp_scale?: number
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
  /** Optional per-slide geometry the model authored, layered over `layout`. Clamped by normalizePlan. */
  placements?: SlidePlacement[]
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

// Ceilings for model-authored freeform placement (see SlidePlacement). normalizePlan clamps every axis
// to these so the worst a poisoned/confused plan can do is a bounded, on-camera, one-undo reposition —
// never send a card to x=1e9. `pos` is in card units (~55 card-gaps from centre each way — roomy for a
// hand-authored spread; huge decks that need more should use a preset). Rotations are model-facing
// DEGREES (converted to radians at the boundary); imp_scale is the impress zoom (default 3).
export const PLACEMENT_BOUNDS = {
  pos: 20000,
  rotateDeg: 180,
  scaleMin: 0.2,
  scaleMax: 12,
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
      placements: {
        type: 'array',
        description:
          'Optional freeform per-slide geometry, layered over "layout". Include only the slides you ' +
          'want to move and only the fields you want to set. Coordinates are in card units: origin is ' +
          'the centre, +x is right, +y is DOWN, one card is ~240 wide with ~360 between neighbours.',
        items: {
          type: 'object',
          properties: {
            id: slideIdEnum,
            x: { type: 'number', description: 'Horizontal position (card units; 0 = centre).' },
            y: { type: 'number', description: 'Vertical position (card units; 0 = centre, +down).' },
            z: { type: 'number', description: 'Depth toward/away from the camera (card units).' },
            rotate_x: { type: 'number', description: 'Tilt about the horizontal axis, in DEGREES.' },
            rotate_y: { type: 'number', description: 'Tilt about the vertical axis, in DEGREES.' },
            rotate_z: { type: 'number', description: 'In-plane spin, in DEGREES.' },
            imp_scale: {
              type: 'number',
              description: 'Zoom/size of the card. 3 is the default; larger is bigger, smaller shrinks.',
            },
          },
          required: ['id'],
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

const DEG2RAD = Math.PI / 180
const clampN = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v

/** A finite number clamped to [lo, hi], or undefined for any non-number/NaN/Infinity — so an absent or
 *  garbage field is simply left unset (the preset/current value shows through) rather than defaulted. */
const clampField = (
  v: unknown,
  lo: number,
  hi: number,
): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? clampN(v, lo, hi) : undefined

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

  // Freeform placements: keep only real, non-duplicate ids; clamp every axis to PLACEMENT_BOUNDS and
  // convert model-facing degrees → radians. An entry that carries no usable geometry (id only) is
  // dropped. This is the trust boundary for raw model-authored coordinates.
  let placements: SlidePlacement[] | undefined
  if (Array.isArray(r.placements)) {
    const B = PLACEMENT_BOUNDS
    const rot = (v: unknown): number | undefined => {
      const deg = clampField(v, -B.rotateDeg, B.rotateDeg)
      return deg === undefined ? undefined : deg * DEG2RAD
    }
    const placed = new Set<string>()
    const list: SlidePlacement[] = []
    for (const p of r.placements) {
      const pp = (p ?? {}) as Record<string, unknown>
      const id = typeof pp.id === 'string' ? pp.id : ''
      if (!known.has(id) || placed.has(id)) continue
      const entry: SlidePlacement = { id }
      const x = clampField(pp.x, -B.pos, B.pos)
      if (x !== undefined) entry.x = x
      const y = clampField(pp.y, -B.pos, B.pos)
      if (y !== undefined) entry.y = y
      const z = clampField(pp.z, -B.pos, B.pos)
      if (z !== undefined) entry.z = z
      const rx = rot(pp.rotate_x)
      if (rx !== undefined) entry.rotate_x = rx
      const ry = rot(pp.rotate_y)
      if (ry !== undefined) entry.rotate_y = ry
      const rz = rot(pp.rotate_z)
      if (rz !== undefined) entry.rotate_z = rz
      const sc = clampField(pp.imp_scale, B.scaleMin, B.scaleMax)
      if (sc !== undefined) entry.imp_scale = sc
      // Object.keys > 1 ⇒ it set at least one axis beyond `id`; id-only entries are noise.
      if (Object.keys(entry).length > 1) {
        placed.add(id)
        list.push(entry)
      }
    }
    if (list.length > 0) placements = list
  }

  const rationale =
    typeof r.rationale === 'string' ? r.rationale.slice(0, 600) : undefined

  return { order, layout, groups, placements, rationale }
}
