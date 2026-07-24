// One-undo body rewrite for the AI Edit lane (aiChatActions.ts `set_body`). The model authors new Markdown
// for ONE slide's PRIMARY body (layout cell 0); we convert it to a stored TipTap `doc` (the same
// markdown→doc path AI Generate uses) and swap it in as a single undoable step. Sibling `cells` and the
// slide's layout/pad/valign columns are deliberately untouched. Like the other ✨ appliers, it rides the
// ordinary `setSlideDoc` mutation, so sync + server-side permission gating come free.
//
// The primary body renders from `doc` once it exists (with raw `markdown` retained only as a legacy
// fallback), so — matching applyGenerated — a rewrite writes only `doc`. Body and positioned objects are
// composited on every slide; there is no rendering-mode switch to coordinate.

import { markdownToDoc } from './aiGenerate'
import type { SetSlideDocArgs } from '../../shared/app-def'
import type { History } from './history'
import type { SlideDetail } from './deckDetail'

/** The `setSlideDoc` mutator, typed like the shared mutator so the live `mutate` object (or its pre-boot
 *  deferred Proxy) is assignable. */
export interface BodyMutate {
  setSlideDoc: (a: SetSlideDocArgs) => unknown
}

/** Rewrite one slide's primary body as ONE undoable step. Captures the current `doc`, sets the converted
 *  Markdown, and pushes a command whose undo restores that doc. Because the mutation writes only `doc`,
 *  every sibling cell and all layout geometry survive both apply and undo. Returns false (no-op) when the
 *  target slide is no longer in the deck — the dispatcher surfaces that to the user. */
export function applyBodyEdit(
  slideId: string,
  markdown: string,
  ctx: { mutate: BodyMutate; history: History; slides: SlideDetail[] },
  label = 'AI edit',
): boolean {
  const { mutate, history, slides } = ctx
  const slide = slides.find((s) => s.id === slideId)
  if (!slide) return false

  const beforeDoc = typeof slide.doc === 'string' ? slide.doc : ''
  const nextDoc = markdownToDoc(markdown)

  const redo = () =>
    mutate.setSlideDoc({ id: slideId, doc: nextDoc, now: Date.now() })
  const undo = () =>
    mutate.setSlideDoc({ id: slideId, doc: beforeDoc, now: Date.now() })
  redo()
  history.push({ label, redo, undo })
  return true
}
