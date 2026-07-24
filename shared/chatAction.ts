// The client ↔ server contract for action-capable "✨ Chat": the actionable half of chat. It lets the model
// drive deck changes when the author asks — recolor the theme, rewrite a slide's body, create/generate
// slides, arrange them, or drop components — through the same isomorphic mutators a human uses (so sync,
// permission gating, and undo come free).
//
// A turn may carry SEVERAL actions (a LIST), applied in order and collapsed into ONE undo. That's what lets
// "make a new slide and put an image on it" happen in a single turn: a `create_slide` (which can declare a
// turn-local `ref`) followed by an `add_image` targeting that ref. The one safety bound left on the list is
// `maxActions` — a generous ceiling so a runaway model can't spawn unbounded network/inference work.
//
// The load-bearing decision (per the plan): the model NEVER names a mutation or emits geometry/ids it wasn't
// given. It emits a small, validated `Action` union — semantics only — that the client dispatcher translates
// to mutators. `normalizeActions` is the firewall (mirrors shared/arrange.ts `normalizePlan`): whatever the
// model returns, a target slide must be a real deck slide OR a `ref` a `create_slide` in the same turn
// declared, colors coerce to bare hex, fonts clamp to the known family set, and free text is length-capped.
// The worst a poisoned slide/theme value can do is a bounded change to the user's OWN deck — one undo away.
//
// Transport is prose + a fenced ```json action block, NOT native tool-calling and NOT streamed json_schema:
// action-capable chat STREAMS (server/chatAct.ts) and Workers AI — the default backend — can't stream JSON
// Mode (developers.cloudflare.com/workers-ai/features/json-mode), so the model writes a friendly reply then
// a fenced JSON array of the changes, which the adapter parses out. `normalizeActions` below is the firewall
// on that parsed list, exactly as before. (Arrange/Generate keep their one-shot json_schema calls — the
// streaming constraint is specific to this path.)

import { clampChatRequest } from './chat.ts'
import type { ChatTurn } from './chat.ts'
import {
  MAX_GENERATED_THEME_CSS,
  sanitizeGeneratedThemeCss,
} from './generatedThemeCss.ts'

// ---- the action union (v1) ------------------------------------------------------------------------

/** One deck change the model may propose. Discriminated by `kind`. Colors are BARE hex (no '#') after
 *  normalization; the client dispatcher maps `set_theme` background/surface into `bg-custom-<hex>` tokens.
 *  Fonts are exact family names from the editor's picker list, or '' to reset to the theme default. */
export type ChatAction =
  | {
      kind: 'set_theme'
      background?: string // slide-card color (bare hex)
      surface?: string //    backdrop color (bare hex)
      heading_color?: string // bare hex, or '' = reset to default
      body_color?: string
      heading_font?: string // known family, or '' = reset to default
      body_font?: string
      text_align?: 'left' | 'center' | 'right'
      /** Full replacement stylesheet, normalized through the generated-theme CSS firewall. */
      custom_stylesheet?: string
    }
  | { kind: 'set_body'; slideId: string; markdown: string } // rewrite cell 0; preserve sibling cells/layout
  | { kind: 'generate'; description: string; count?: number } // author + append new slides
  | { kind: 'arrange'; instruction: string } // reorder / lay out the slides
  // Add ONE blank slide (appended to the deck). `ref` is a turn-local alias later actions in the SAME turn
  // can target (via their `slideId`) — the id doesn't exist until the client mints it, so a ref is how the
  // model says "put this on the slide I just made". `markdown` optionally seeds the new slide's body.
  | { kind: 'create_slide'; ref?: string; markdown?: string }
  // Author a free-form spatial component onto a slide (the model emits semantics only; the client dispatcher
  // places it and resolves any URL/build). `slideId` targets a real deck slide OR a same-turn `create_slide`
  // ref; omitted, it lands on the most-recently-created slide this turn, else the active slide.
  | {
      kind: 'add_image'
      source: 'generate' | 'search' | 'url' // how `value` resolves to an image src (client picks the path)
      value: string // generate: an image DESCRIPTION · search: a photo QUERY · url: a full https URL
      alt?: string
      slideId?: string
    }
  | { kind: 'add_web'; src: string; slideId?: string } // embed a live website (webframe). `src` is a full http(s) URL.
  | { kind: 'add_artifact'; code: string; title?: string; slideId?: string } // author a runnable component + drop it live

/** What the action-capable chat model returns: a short prose confirmation/answer (`say`) plus the LIST of
 *  deck changes to apply, in order (empty = advice only, no deck change). Mirrors the Arrange/Generate
 *  result shape. */
export interface ChatActResult {
  say: string
  actions: ChatAction[]
}

/** Grounding beyond the digest: the deck's CURRENT resolved theme (so "make it warmer" / "match the
 *  accent" is grounded in real colors) — see the plan's grounding note. Colors are CSS values as the
 *  client resolves them (`#rrggbb` or a gradient string); fonts are family names. */
export interface ChatActTheme {
  background: string
  surface: string
  headingColor: string
  bodyColor: string
  headingFont: string
  bodyFont: string
  textAlign: string
  customStylesheet: string
}

/** The currently-active slide's id + its FULL visible body text (not the 240-char digest excerpt), with
 *  cell labels when tiled — the natural target for a `set_body` rewrite ("tighten this slide").
 *  `set_body` replaces only Cell 1; labeled sibling cells are grounding and remain untouched.
 *  Absent when no slide is active / it's empty.
 *  `notes` carries the author's private RESEARCH notes / backing evidence for this slide (flattened text)
 *  when they've written any — grounding for "draft this slide from my notes". Never shown in a presentation. */
export interface ChatActSlide {
  id: string
  text: string
  notes?: string
}

/** POST body of `/api/chat/act`. Extends the advisor's ChatRequest (conversation + append-only deck
 *  context) with a slide-id allowlist and the two extra grounding channels the data-hungry actions need.
 *  The server re-clamps everything. */
export interface ChatActRequest {
  deckId: string
  messages: ChatTurn[]
  deckContext: string
  /** Real slide ids currently in the deck. Used only as the action-target validation allowlist. */
  slideIds: string[]
  theme?: ChatActTheme
  activeSlide?: ChatActSlide
}

// Server-side ceilings on the model's OUTPUT (input caps are inherited from CHAT_LIMITS via
// clampChatRequest). Every free-text field is truncated, never rejected, so a chatty model still applies.
export const CHAT_ACTION_LIMITS = {
  maxSay: 800,
  maxMarkdown: 4000, // one slide's body (mirrors GENERATE_LIMITS.maxMarkdownPerSlide)
  maxInstruction: 600, // mirrors ARRANGE_LIMITS.maxInstruction
  maxDescription: 2000, // mirrors GENERATE_LIMITS.maxPrompt
  maxCount: 40, // mirrors GENERATE_LIMITS.maxSlides
  maxActiveText: 8000, // the active slide's full body, for set_body grounding
  maxActiveNotes: 8000, // the active slide's research notes, for evidence-grounded rewrites
  maxThemeField: 80,
  maxThemeCssContext: MAX_GENERATED_THEME_CSS,
  maxSlideIds: 150,
  maxSlideId: 200,
  maxImageValue: 600, // add_image `value` in generate/search mode (a description / query)
  maxUrl: 2000, //       any URL: add_web src + add_image url-mode value (URLs run longer than 600)
  maxAlt: 300, //        add_image alt text
  maxArtifactCode: 16000, // add_artifact source — generous, but well under the 512 KB build cap
  maxRef: 64, //          a create_slide turn-local alias
  // The one bound on a turn's action LIST. Not a product bound (the author asked for no per-turn ceiling on
  // components/slides) but a runaway guard: every add_image/generate can fan out to network/inference, so an
  // unbounded list is a cost/DoS vector. Sized well past any real "build me a slide with a few things" turn.
  maxActions: 25,
} as const

// Coerce an untrusted value to a string — the request is parsed from JSON, so declared types are only a
// hope until checked (and it keeps the truncation below null-safe).
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

/** Trim a request to the ceilings before it reaches the model. Reuses clampChatRequest for the shared
 *  conversation/digest half, then clamps the two extra grounding channels. Pure; used server-side. */
export function clampChatActRequest(req: ChatActRequest): ChatActRequest {
  const base = clampChatRequest({
    deckId: req.deckId,
    messages: req.messages,
    deckContext: req.deckContext,
  })
  const out: ChatActRequest = {
    deckId: base.deckId,
    messages: base.messages,
    deckContext: base.deckContext,
    slideIds: Array.isArray(req.slideIds)
      ? req.slideIds
          .map((id) => str(id).slice(0, CHAT_ACTION_LIMITS.maxSlideId))
          .filter(Boolean)
          .slice(0, CHAT_ACTION_LIMITS.maxSlideIds)
      : [],
  }
  const t = req.theme
  if (t && typeof t === 'object') {
    const cap = CHAT_ACTION_LIMITS.maxThemeField
    out.theme = {
      background: str(t.background).slice(0, cap),
      surface: str(t.surface).slice(0, cap),
      headingColor: str(t.headingColor).slice(0, cap),
      bodyColor: str(t.bodyColor).slice(0, cap),
      headingFont: str(t.headingFont).slice(0, cap),
      bodyFont: str(t.bodyFont).slice(0, cap),
      textAlign: str(t.textAlign).slice(0, cap),
      customStylesheet: str(t.customStylesheet).slice(
        0,
        CHAT_ACTION_LIMITS.maxThemeCssContext,
      ),
    }
  }
  const a = req.activeSlide
  if (a && typeof a === 'object') {
    const id = str(a.id)
    if (id) {
      out.activeSlide = {
        id,
        text: str(a.text).slice(0, CHAT_ACTION_LIMITS.maxActiveText),
      }
      const notes = str(a.notes).slice(0, CHAT_ACTION_LIMITS.maxActiveNotes)
      if (notes) out.activeSlide.notes = notes
    }
  }
  return out
}

// The model is prompted to emit the action as a fenced ```json object (see server/chatAct.ts systemPrompt);
// there is no response_format schema handed to the model anymore (Workers AI can't stream JSON Mode). The
// slide-id + font allowlists that used to `enum`-nudge the schema now live in that prompt, and the firewall
// below is — as it always was — the actual guarantee.

// ---- the firewall ---------------------------------------------------------------------------------

const HEX_RE = /^#?([0-9a-fA-F]{3,8})$/

/** Coerce an untrusted color to a BARE hex string (no '#', lowercased), or undefined if it isn't a valid
 *  3/4/6/8-digit hex. Bare is the stored form for text colors; the dispatcher wraps bg/surface hex into a
 *  `bg-custom-<hex>` token. Anything unparseable is dropped (the field is simply left untouched). */
function bareHex(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const m = v.trim().match(HEX_RE)
  if (!m) return undefined
  const h = m[1].toLowerCase()
  return h.length === 3 || h.length === 4 || h.length === 6 || h.length === 8
    ? h
    : undefined
}

/** Coerce an untrusted value to a safe http(s) URL string (trimmed), or undefined. This is a SECURITY
 *  gate, not cosmetics: `add_web` renders `<iframe src>` UNSANDBOXED in the app origin (render.tsx), so a
 *  `javascript:`/`data:`/`blob:` URL from a poisoned action would run script in our origin when a shared
 *  deck is viewed by others. Only http/https survive; the length cap bounds pathological URLs. */
function httpUrl(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim().slice(0, CHAT_ACTION_LIMITS.maxUrl)
  if (!t) return undefined
  let u: URL
  try {
    u = new URL(t)
  } catch {
    return undefined
  }
  return u.protocol === 'http:' || u.protocol === 'https:' ? t : undefined
}

/** Clamp a font to the editor's known family set (case-insensitive exact match), '' to reset to the theme
 *  default, or undefined to DROP the field (an unknown/garbled family leaves the current font untouched,
 *  never silently resets it). The allowlist is the editor's font-picker list (single source of truth). */
function clampFont(v: unknown, fonts: string[]): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  if (t === '') return ''
  return fonts.find((f) => f.toLowerCase() === t.toLowerCase())
}

/** Validate + normalize a raw model result into the LIST of actions to apply. This is the trust boundary
 *  between untrusted model output and the apply path (mirrors normalizePlan). Always total: junk in →
 *  `{ say: '', actions: [] }`. Accepts either `actions: [...]` (the new shape) or a single `action` (a model
 *  that emitted one). Two passes: first collect every `ref` a `create_slide` declares, so a later action can
 *  legally target a slide that doesn't exist yet; then normalize each action against `deck slide ids ∪ refs`.
 *  The list is capped at `maxActions`. A surviving action can only touch the user's own deck (or a slide it
 *  creates this turn) with in-range values, one undo away. */
export function normalizeActions(
  raw: unknown,
  opts: { slideIds: string[]; fonts: string[] },
): ChatActResult {
  const r = (raw ?? {}) as Record<string, unknown>
  const say =
    typeof r.say === 'string' ? r.say.slice(0, CHAT_ACTION_LIMITS.maxSay) : ''

  const list: unknown[] = Array.isArray(r.actions)
    ? r.actions
    : r.action != null
      ? [r.action]
      : []

  // Pass 1: the ref every create_slide declares — the set a later action may target on top of real ids.
  const refs = new Set<string>()
  for (const a of list) {
    const o = (a ?? {}) as Record<string, unknown>
    if (o.kind === 'create_slide' && typeof o.ref === 'string' && o.ref.trim())
      refs.add(o.ref.slice(0, CHAT_ACTION_LIMITS.maxRef).trim())
  }
  const allowed = new Set<string>([...opts.slideIds, ...refs])

  const actions: ChatAction[] = []
  for (const a of list) {
    if (actions.length >= CHAT_ACTION_LIMITS.maxActions) break
    const norm = normalizeOneAction(a, { fonts: opts.fonts, allowed })
    if (norm) actions.push(norm)
  }
  return { say, actions }
}

/** A model-supplied slide target coerced to a valid one: a real deck slide id or a same-turn create_slide
 *  ref, else undefined (the dispatcher then falls back to the last-created / active slide). */
function targetSlide(v: unknown, allowed: Set<string>): string | undefined {
  return typeof v === 'string' && allowed.has(v) ? v : undefined
}

function normalizeOneAction(
  raw: unknown,
  opts: { allowed: Set<string>; fonts: string[] },
): ChatAction | null {
  const r = (raw ?? {}) as Record<string, unknown>
  switch (r.kind) {
    case 'set_theme': {
      const out: Extract<ChatAction, { kind: 'set_theme' }> = {
        kind: 'set_theme',
      }
      const bg = bareHex(r.background)
      if (bg) out.background = bg
      const surface = bareHex(r.surface)
      if (surface) out.surface = surface
      const hc = bareHex(r.heading_color)
      if (hc) out.heading_color = hc
      const bc = bareHex(r.body_color)
      if (bc) out.body_color = bc
      const hf = clampFont(r.heading_font, opts.fonts)
      if (hf !== undefined) out.heading_font = hf
      const bf = clampFont(r.body_font, opts.fonts)
      if (bf !== undefined) out.body_font = bf
      if (
        r.text_align === 'left' ||
        r.text_align === 'center' ||
        r.text_align === 'right'
      )
        out.text_align = r.text_align
      const stylesheet = sanitizeGeneratedThemeCss(r.custom_stylesheet)
      if (stylesheet !== undefined) out.custom_stylesheet = stylesheet
      // An action that set no usable field is noise — drop it (nothing to apply).
      return Object.keys(out).length > 1 ? out : null
    }
    case 'set_body': {
      // A real slide of THIS deck OR a slide a create_slide declared this turn.
      const slideId = targetSlide(r.slideId, opts.allowed)
      if (!slideId) return null
      const markdown =
        typeof r.markdown === 'string'
          ? r.markdown.slice(0, CHAT_ACTION_LIMITS.maxMarkdown).trim()
          : ''
      if (!markdown) return null
      return { kind: 'set_body', slideId, markdown }
    }
    case 'create_slide': {
      const out: Extract<ChatAction, { kind: 'create_slide' }> = {
        kind: 'create_slide',
      }
      if (typeof r.ref === 'string' && r.ref.trim())
        out.ref = r.ref.slice(0, CHAT_ACTION_LIMITS.maxRef).trim()
      if (typeof r.markdown === 'string' && r.markdown.trim())
        out.markdown = r.markdown
          .slice(0, CHAT_ACTION_LIMITS.maxMarkdown)
          .trim()
      return out
    }
    case 'generate': {
      const description =
        typeof r.description === 'string'
          ? r.description.slice(0, CHAT_ACTION_LIMITS.maxDescription).trim()
          : ''
      if (!description) return null
      const out: Extract<ChatAction, { kind: 'generate' }> = {
        kind: 'generate',
        description,
      }
      if (typeof r.count === 'number' && Number.isFinite(r.count)) {
        out.count = Math.max(
          1,
          Math.min(CHAT_ACTION_LIMITS.maxCount, Math.round(r.count)),
        )
      }
      return out
    }
    case 'arrange': {
      const instruction =
        typeof r.instruction === 'string'
          ? r.instruction.slice(0, CHAT_ACTION_LIMITS.maxInstruction).trim()
          : ''
      // Empty instruction is allowed — /api/arrange treats it as "use your best judgment".
      return { kind: 'arrange', instruction }
    }
    case 'add_image': {
      const source =
        r.source === 'generate' || r.source === 'search' || r.source === 'url'
          ? r.source
          : undefined
      if (!source) return null
      // url mode is the only one whose `value` is a URL — gate it through httpUrl (blocks javascript:/data:).
      const value =
        source === 'url'
          ? httpUrl(r.value)
          : typeof r.value === 'string'
            ? r.value.slice(0, CHAT_ACTION_LIMITS.maxImageValue).trim()
            : ''
      if (!value) return null
      const out: Extract<ChatAction, { kind: 'add_image' }> = {
        kind: 'add_image',
        source,
        value,
      }
      if (typeof r.alt === 'string' && r.alt.trim())
        out.alt = r.alt.slice(0, CHAT_ACTION_LIMITS.maxAlt).trim()
      const tgt = targetSlide(r.slideId, opts.allowed)
      if (tgt) out.slideId = tgt
      return out
    }
    case 'add_web': {
      const src = httpUrl(r.src)
      if (!src) return null // http(s) only — see httpUrl
      const out: Extract<ChatAction, { kind: 'add_web' }> = {
        kind: 'add_web',
        src,
      }
      const tgt = targetSlide(r.slideId, opts.allowed)
      if (tgt) out.slideId = tgt
      return out
    }
    case 'add_artifact': {
      const code =
        typeof r.code === 'string'
          ? r.code.slice(0, CHAT_ACTION_LIMITS.maxArtifactCode)
          : ''
      if (!code.trim()) return null
      const out: Extract<ChatAction, { kind: 'add_artifact' }> = {
        kind: 'add_artifact',
        code,
      }
      if (typeof r.title === 'string' && r.title.trim())
        out.title = r.title.slice(0, 120).trim()
      const tgt = targetSlide(r.slideId, opts.allowed)
      if (tgt) out.slideId = tgt
      return out
    }
    default:
      return null
  }
}
