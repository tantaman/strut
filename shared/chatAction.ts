// The client ↔ server contract for "✨ Chat — Edit lane" (AI_CHAT_TOOLS_PLAN.md): the actionable half of
// chat. Where the advisor (shared/chat.ts) only TALKS, the Edit lane lets the model drive ONE deck change
// per turn — recolor the theme, rewrite a slide's body, generate slides, or arrange them — through the same
// isomorphic mutators a human uses (so sync, permission gating, and undo come free).
//
// The load-bearing decision (per the plan): the model NEVER names a mutation or emits geometry/ids it wasn't
// given. It emits a small, validated `Action` union — semantics only — that the client dispatcher translates
// to mutators. `normalizeAction` is the firewall (mirrors shared/arrange.ts `normalizePlan`): whatever the
// model returns, target slide ids must exist in the digest, colors coerce to bare hex, fonts clamp to the
// known family set, and free text is length-capped. The worst a poisoned slide/theme value can do is a
// bounded change to the user's OWN deck — one undo away.
//
// Transport is prose + a fenced ```json action block, NOT native tool-calling and NOT streamed json_schema:
// the Edit lane STREAMS (server/chatAct.ts) and Workers AI — the default backend — can't stream JSON Mode
// (developers.cloudflare.com/workers-ai/features/json-mode), so the model writes a friendly reply then a
// fenced JSON object for the change, which the adapter parses out. `normalizeAction` below is the firewall
// on that parsed object, exactly as before. (Arrange/Generate keep their one-shot json_schema calls — the
// streaming constraint is specific to this lane.)

import { clampChatRequest } from './chat.ts'
import type { ChatTurn, SlideDigest } from './chat.ts'

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
    }
  | { kind: 'set_body'; slideId: string; markdown: string } // rewrite ONE slide's body
  | { kind: 'generate'; description: string; count?: number } // author + append new slides
  | { kind: 'arrange'; instruction: string } // reorder / lay out the slides
  // Author a free-form spatial component onto the ACTIVE slide (the model emits semantics only; the client
  // dispatcher places it and resolves any URL/build). One per turn, like every other action.
  | {
      kind: 'add_image'
      source: 'generate' | 'search' | 'url' // how `value` resolves to an image src (client picks the path)
      value: string // generate: an image DESCRIPTION · search: a photo QUERY · url: a full https URL
      alt?: string
    }
  | { kind: 'add_web'; src: string } // embed a live website (webframe). `src` is a full http(s) URL.
  | { kind: 'add_artifact'; code: string; title?: string } // author a runnable component + drop it live

/** What the Edit-lane model returns: a short prose confirmation/answer (`say`) plus at most one `action`
 *  (null = advice only, no deck change). Mirrors the Arrange/Generate `{plan}`/`{deck}` result shape. */
export interface ChatActResult {
  say: string
  action: ChatAction | null
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
}

/** The currently-active slide's id + its FULL body text (not the 240-char digest excerpt) — the natural
 *  target for a `set_body` rewrite ("tighten this slide"). Absent when no slide is active / it's empty. */
export interface ChatActSlide {
  id: string
  text: string
}

/** POST body of `/api/chat/act`. Extends the advisor's ChatRequest (conversation + deck digest) with the
 *  two extra grounding channels the two data-hungry actions need. The server re-clamps everything. */
export interface ChatActRequest {
  deckId: string
  messages: ChatTurn[]
  slides: SlideDigest[]
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
  maxCount: 15, // mirrors GENERATE_LIMITS.maxSlides
  maxActiveText: 8000, // the active slide's full body, for set_body grounding
  maxThemeField: 80,
  maxImageValue: 600, // add_image `value` in generate/search mode (a description / query)
  maxUrl: 2000, //       any URL: add_web src + add_image url-mode value (URLs run longer than 600)
  maxAlt: 300, //        add_image alt text
  maxArtifactCode: 16000, // add_artifact source — generous, but well under the 512 KB build cap
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
    slides: req.slides,
  })
  const out: ChatActRequest = {
    deckId: base.deckId,
    messages: base.messages,
    slides: base.slides,
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
    }
  }
  const a = req.activeSlide
  if (a && typeof a === 'object') {
    const id = str(a.id)
    if (id)
      out.activeSlide = {
        id,
        text: str(a.text).slice(0, CHAT_ACTION_LIMITS.maxActiveText),
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

/** Validate + normalize a raw model result against the deck's ACTUAL slide ids + font allowlist. This is
 *  the trust boundary between untrusted model output and the apply path (mirrors normalizePlan). Always
 *  total: junk in → `{ say: '', action: null }`. A surviving action can only touch the user's own deck
 *  with in-range values, one undo away. */
export function normalizeAction(
  raw: unknown,
  opts: { slideIds: string[]; fonts: string[] },
): ChatActResult {
  const r = (raw ?? {}) as Record<string, unknown>
  const say =
    typeof r.say === 'string' ? r.say.slice(0, CHAT_ACTION_LIMITS.maxSay) : ''
  return { say, action: normalizeOneAction(r.action, opts) }
}

function normalizeOneAction(
  raw: unknown,
  opts: { slideIds: string[]; fonts: string[] },
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
      // An action that set no usable field is noise — drop it (nothing to apply).
      return Object.keys(out).length > 1 ? out : null
    }
    case 'set_body': {
      const slideId = typeof r.slideId === 'string' ? r.slideId : ''
      if (!opts.slideIds.includes(slideId)) return null // must be a real slide of THIS deck
      const markdown =
        typeof r.markdown === 'string'
          ? r.markdown.slice(0, CHAT_ACTION_LIMITS.maxMarkdown).trim()
          : ''
      if (!markdown) return null
      return { kind: 'set_body', slideId, markdown }
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
      return out
    }
    case 'add_web': {
      const src = httpUrl(r.src)
      if (!src) return null // http(s) only — see httpUrl
      return { kind: 'add_web', src }
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
      return out
    }
    default:
      return null
  }
}
