// Client dispatcher for the "✨ Chat — Edit lane": route ONE normalized ChatAction to the right one-undo
// apply path. Two of the four kinds reuse the SHIPPED ✨ features verbatim — `arrange` re-runs the existing
// /api/arrange flow → applyPlan, `generate` re-runs /api/generate → applyGenerated — so they inherit those
// features' prompting, normalize firewall, and one-undo apply with zero new code. Only `set_theme` and
// `set_body` are genuinely new apply code (aiTheme.ts / aiBody.ts).
//
// Every applied action flows through `app.mutate.*`, so the server permission guards
// (withSlideEditable/withDeckEditable, server/rindle-api.ts) reject an edit the user can't make regardless
// of who produced it — an unauthorized action just snaps back. No extra permission checks here.

import { newId } from '../config'
import { applyPlan, buildDigest } from './aiArrange'
import { applyGenerated } from './aiGenerate'
import { applyThemePatch } from './aiTheme'
import type { ThemeDeck, ThemeMutate, ThemePatch } from './aiTheme'
import { applyBodyEdit } from './aiBody'
import type { BodyMutate } from './aiBody'
import type { ArrangeMutate } from './aiArrange'
import type { GenerateMutate } from './aiGenerate'
import type { History } from './history'
import type { SlideDetail } from './deckDetail'
import type { ChatAction } from '../../shared/chatAction'
import type { ArrangementPlan } from '../../shared/arrange'
import type { GeneratedDeck } from '../../shared/generate'
import type { MintCustomColorArgs } from '../../shared/app-def'

/** The union of mutators the dispatcher needs — the live `mutate` facade (which has them all) is
 *  assignable. Kept structural so we don't depend on the concrete app type. */
export type ChatActionMutate = ArrangeMutate &
  GenerateMutate &
  ThemeMutate &
  BodyMutate & { mintCustomColor: (a: MintCustomColorArgs) => unknown }

export interface DispatchCtx {
  deckId: string
  slides: SlideDetail[]
  deck: ThemeDeck | null
  mutate: ChatActionMutate
  history: History
}

/** The outcome of an apply. `label` is the undo-stack label (also shown on the chat's Undo chip). */
export type DispatchOutcome =
  | { ok: true; label: string }
  | { ok: false; error: string }

/** Route a normalized action to its apply path. Async because `arrange`/`generate` make a server round-trip
 *  to the existing ✨ endpoints before applying; `set_theme`/`set_body` are synchronous local applies. */
export async function dispatchAction(
  action: ChatAction,
  ctx: DispatchCtx,
): Promise<DispatchOutcome> {
  switch (action.kind) {
    case 'set_theme':
      return applyTheme(action, ctx)
    case 'set_body':
      return applyBody(action, ctx)
    case 'generate':
      return runGenerate(action, ctx)
    case 'arrange':
      return runArrange(action, ctx)
    default:
      return { ok: false, error: 'Unknown action.' }
  }
}

// ---- set_theme -------------------------------------------------------------------------------------

/** A bare hex → `bg-custom-<hex>` class token (the vocabulary deck.background/surface store). */
function customToken(hex: string): string {
  return `bg-custom-${hex}`
}

function applyTheme(
  a: Extract<ChatAction, { kind: 'set_theme' }>,
  ctx: DispatchCtx,
): DispatchOutcome {
  if (!ctx.deck) return { ok: false, error: 'No deck to theme.' }
  const patch: ThemePatch = {}

  // background/surface store a CLASS TOKEN, not raw hex — wrap the model's hex into `bg-custom-<hex>` and
  // mint the matching style rule (so it also resolves in export / other surfaces), exactly like the manual
  // custom-color pick (Header.setCustom). The mint is fire-and-forget (not on undo) — a lingering unused
  // style rule is harmless, and undo reverts the deck column to its prior token.
  if (a.background) {
    const token = customToken(a.background)
    mintCustom(ctx, token, a.background)
    patch.background = token
  }
  if (a.surface) {
    const token = customToken(a.surface)
    mintCustom(ctx, token, a.surface)
    patch.surface = token
  }
  // Text colors are stored as bare hex directly; fonts as family names ('' = reset to default).
  if (a.heading_color !== undefined) patch.heading_color = a.heading_color
  if (a.body_color !== undefined) patch.body_color = a.body_color
  if (a.heading_font !== undefined) patch.heading_font = a.heading_font
  if (a.body_font !== undefined) patch.body_font = a.body_font

  if (Object.keys(patch).length === 0)
    return { ok: false, error: 'Nothing to change in the theme.' }

  applyThemePatch(
    patch,
    { mutate: ctx.mutate, history: ctx.history, deck: ctx.deck },
    'AI theme',
  )
  return { ok: true, label: 'AI theme' }
}

function mintCustom(ctx: DispatchCtx, token: string, hex: string): void {
  ctx.mutate.mintCustomColor({
    id: newId(),
    deckId: ctx.deckId,
    klass: token,
    style: `.${token}{background:#${hex}}`,
  })
}

// ---- set_body --------------------------------------------------------------------------------------

function applyBody(
  a: Extract<ChatAction, { kind: 'set_body' }>,
  ctx: DispatchCtx,
): DispatchOutcome {
  const ok = applyBodyEdit(
    a.slideId,
    a.markdown,
    { mutate: ctx.mutate, history: ctx.history, slides: ctx.slides },
    'AI edit',
  )
  return ok
    ? { ok: true, label: 'AI edit' }
    : { ok: false, error: 'That slide is no longer in the deck.' }
}

// ---- generate (reuses /api/generate → applyGenerated) ---------------------------------------------

async function runGenerate(
  a: Extract<ChatAction, { kind: 'generate' }>,
  ctx: DispatchCtx,
): Promise<DispatchOutcome> {
  // The count (if any) rides in the prompt — /api/generate infers the number from the description text.
  const prompt = a.count
    ? `${a.description} — produce ${a.count} slides`
    : a.description
  let res: Response
  try {
    res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ deckId: ctx.deckId, prompt }),
    })
  } catch {
    return { ok: false, error: 'Network error — try again.' }
  }
  if (!res.ok) return { ok: false, error: await friendlyError(res) }
  const deck = (await res.json().catch(() => null)) as GeneratedDeck | null
  if (!deck || !Array.isArray(deck.slides) || deck.slides.length === 0)
    return { ok: false, error: 'No slides came back — try rephrasing.' }
  applyGenerated(
    deck,
    ctx.mutate,
    { deckId: ctx.deckId, slides: ctx.slides },
    ctx.history,
  )
  return { ok: true, label: 'Generate slides' }
}

// ---- arrange (reuses /api/arrange → applyPlan) ----------------------------------------------------

async function runArrange(
  a: Extract<ChatAction, { kind: 'arrange' }>,
  ctx: DispatchCtx,
): Promise<DispatchOutcome> {
  if (ctx.slides.length === 0)
    return { ok: false, error: 'There are no slides to arrange.' }
  let res: Response
  try {
    res = await fetch('/api/arrange', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        deckId: ctx.deckId,
        instruction: a.instruction,
        slides: buildDigest(ctx.slides),
      }),
    })
  } catch {
    return { ok: false, error: 'Network error — try again.' }
  }
  if (!res.ok) return { ok: false, error: await friendlyError(res) }
  const plan = (await res.json().catch(() => null)) as ArrangementPlan | null
  if (!plan || !Array.isArray(plan.order))
    return { ok: false, error: 'The arrangement came back malformed.' }
  applyPlan(plan, ctx.mutate, ctx.slides, ctx.history)
  return { ok: true, label: 'AI arrange' }
}

// Shared friendly-error mapper for the delegated /api/arrange + /api/generate calls (mirrors the inline
// forms' error copy).
async function friendlyError(res: Response): Promise<string> {
  if (res.status === 401) return 'Sign in to edit your deck with AI.'
  const b = (await res.json().catch(() => null)) as { message?: string } | null
  return (
    b?.message ??
    (res.status === 429
      ? 'Too many requests — wait a moment and try again.'
      : 'The AI is unavailable right now.')
  )
}
