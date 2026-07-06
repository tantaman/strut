// Client side of "✨ AI Arrange": turn the deck the editor already has into a compact digest for the
// model (buildDigest), preview a returned plan without touching Rindle (previewCards), and apply it as a
// SINGLE undoable step (applyPlan). The AI is just another producer of the two mutations a human drag
// already makes — `reorderSlide` (reading/camera order) + `setSlideTransform` (spatial layout) — so this
// inherits sync, server-side permission gating, and undo for free. See AI_ARRANGE_PLAN.md.

import type { JSONContent } from '@tiptap/core'
import { keysBetween } from '../lib/order'
import { parseDoc } from './tiptapDoc'
import { LAYOUTS } from './layouts'
import type { LayoutTransform } from './layouts'
import type { History } from './history'
import type { SlideDetail } from './deckDetail'
import { ARRANGE_LIMITS } from '../../shared/arrange'
import type { ArrangementPlan, SlideDigest } from '../../shared/arrange'
import type {
  ReorderSlideArgs,
  SetSlideTransformArgs,
} from '../../shared/app-def'

// The two mutations we call, typed exactly like the shared mutators so the live `mutate` object (or its
// pre-boot deferred Proxy) is assignable — no dependency on the concrete app type.
export interface ArrangeMutate {
  reorderSlide: (a: ReorderSlideArgs) => unknown
  setSlideTransform: (a: SetSlideTransformArgs) => unknown
}

type Xform = Omit<LayoutTransform, never> // { x, y, z, rotate_x, rotate_y, rotate_z, imp_scale }

function xformOf(s: SlideDetail): Xform {
  return {
    x: s.x,
    y: s.y,
    z: s.z,
    rotate_x: s.rotate_x,
    rotate_y: s.rotate_y,
    rotate_z: s.rotate_z,
    imp_scale: s.imp_scale,
  }
}

function xformEq(a: Xform, b: Xform): boolean {
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.z === b.z &&
    a.rotate_x === b.rotate_x &&
    a.rotate_y === b.rotate_y &&
    a.rotate_z === b.rotate_z &&
    a.imp_scale === b.imp_scale
  )
}

// The model's freeform per-slide overrides, keyed by id. `normalizePlan` already dropped undefined
// fields and clamped/rad-converted the rest, so each value is a partial transform ready to spread over a
// base geometry ({...base, ...override} sets only the axes the model actually authored).
function placementOverrides(plan: ArrangementPlan): Map<string, Partial<Xform>> {
  const m = new Map<string, Partial<Xform>>()
  for (const p of plan.placements ?? []) {
    const { id, ...rest } = p
    m.set(id, rest)
  }
  return m
}

// Collect the plain text of a TipTap doc (markdown-mode slides store content as doc JSON) by walking
// text nodes — cheaper and safer than rendering to HTML and stripping tags.
function docText(raw: string | null | undefined): string {
  const parts: string[] = []
  const walk = (n: JSONContent) => {
    if (typeof n.text === 'string') parts.push(n.text)
    if (Array.isArray(n.content)) n.content.forEach(walk)
  }
  walk(parseDoc(raw))
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

// Slides have no `title` column. Their readable content lives in the markdown-mode `doc` (the default
// slide mode) or the legacy raw-markdown `markdown` column — both plain scalars on the slide row.
// (Spatial slides carry their text in component fragment refs, which need a React `useFragment` to read;
// pulling that into the digest is a follow-up — see AI_ARRANGE_PLAN.md. Markdown is the default, so the
// model still has content to reason about for typical decks.)
function slideText(s: SlideDetail): string {
  const fromDoc = docText(s.doc)
  if (fromDoc) return fromDoc
  const md = s.markdown
  return typeof md === 'string'
    ? md
        .replace(/[#*_>`~-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : ''
}

/** Reduce the editor's live slides to the model digest (the client already has this rendered — no
 *  server re-read). Title is a short prefix of the content (slides have no title column); truncation is
 *  best-effort here — the server re-clamps to ARRANGE_LIMITS. */
export function buildDigest(slides: SlideDetail[]): SlideDigest[] {
  return slides.map((s) => {
    const text = slideText(s)
    return {
      id: s.id,
      title: text.slice(0, 80).trim(),
      text: text.slice(0, ARRANGE_LIMITS.maxTextPerSlide),
    }
  })
}

// Complete `plan.order` into a full permutation of the current slides (normalizePlan already does this
// server-side, but the deck may have changed under the preview — stay defensive).
function fullOrder(plan: ArrangementPlan, slides: SlideDetail[]): string[] {
  const byId = new Map(slides.map((s) => [s.id, s]))
  const order = plan.order.filter((id) => byId.has(id))
  const seen = new Set(order)
  for (const s of slides) if (!seen.has(s.id)) order.push(s.id)
  return order
}

export interface PreviewCard extends Xform {
  id: string
  /** 0-based position in the proposed reading order (badge = index + 1). */
  index: number
}

/** Where each card WOULD land under a plan, without mutating anything — drives the ghost overlay. When
 *  `layout` is 'keep' the positions are the slides' current transforms (only the order/badges change). */
export function previewCards(
  plan: ArrangementPlan,
  slides: SlideDetail[],
): PreviewCard[] {
  const byId = new Map(slides.map((s) => [s.id, s]))
  const order = fullOrder(plan, slides)
  const def =
    plan.layout !== 'keep'
      ? LAYOUTS.find((l) => l.id === plan.layout)
      : undefined
  const placed = def ? def.arrange(order.length) : null
  const overrides = placementOverrides(plan)
  return order.map((id, i) => {
    const s = byId.get(id)!
    // preset (or current transform when 'keep') as the base, then the model's per-slide overrides.
    return { id, index: i, ...(placed ? placed[i] : xformOf(s)), ...overrides.get(id) }
  })
}

/** Apply a plan as ONE undoable step: re-key every slide into the new reading order, then (unless
 *  'keep') lay the cards out with the chosen preset over that new order. Mirrors Overview.applyLayout —
 *  the whole AI decision reverts in a single Cmd/Ctrl+Z. */
export function applyPlan(
  plan: ArrangementPlan,
  mutate: ArrangeMutate,
  slides: SlideDetail[],
  history: History,
): void {
  if (slides.length === 0) return
  const order = fullOrder(plan, slides)

  // Reading/camera order — fresh, evenly-spaced fractional keys so the slides sort into `order`.
  const newKeys = keysBetween(null, null, order.length)
  const beforeSort = new Map(slides.map((s) => [s.id, s.sort]))
  const applyOrder = () =>
    order.forEach((id, i) => mutate.reorderSlide({ id, sort: newKeys[i] }))
  const undoOrder = () =>
    slides.forEach((s) =>
      mutate.reorderSlide({ id: s.id, sort: beforeSort.get(s.id)! }),
    )

  // Spatial layout — the preset is computed over the NEW order, so placed[i] belongs to order[i]. The
  // model's freeform placements then override per-slide axes on top of that base (or on the slide's
  // current transform when layout is 'keep'). We mutate ONLY the slides whose transform actually changes,
  // so a 'keep' + few-placements plan nudges those cards and leaves the rest — and the whole thing is one
  // undo, restoring each touched slide to the transform captured here.
  const def =
    plan.layout !== 'keep'
      ? LAYOUTS.find((l) => l.id === plan.layout)
      : undefined
  const placed = def ? def.arrange(order.length) : null
  const overrides = placementOverrides(plan)
  const beforeX = new Map(slides.map((s) => [s.id, xformOf(s)]))
  const finalX = new Map<string, Xform>()
  order.forEach((id, i) => {
    const base = placed ? placed[i] : beforeX.get(id)!
    finalX.set(id, { ...base, ...overrides.get(id) })
  })
  const changed = order.filter(
    (id) => !xformEq(finalX.get(id)!, beforeX.get(id)!),
  )
  const applyXform = () =>
    changed.forEach((id) =>
      mutate.setSlideTransform({ id, ...finalX.get(id)!, now: Date.now() }),
    )
  const undoXform = () =>
    changed.forEach((id) =>
      mutate.setSlideTransform({ id, ...beforeX.get(id)!, now: Date.now() }),
    )

  const redo = () => {
    applyOrder()
    applyXform()
  }
  const undo = () => {
    undoOrder()
    undoXform()
  }
  redo()
  history.push({ label: 'AI arrange', redo, undo })
}
