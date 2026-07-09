// The client ↔ server contract for "✨ Chat" — the advisor of the ✨ family (alongside AI Arrange, which
// REORDERS slides, and AI Generate, which AUTHORS them). Chat neither reorders nor authors: it TALKS. The
// user converses with a model that can *see* the deck (grounded via the same digest AI Arrange builds) and
// answers in streamed prose — "does this flow?", "what's a stronger closing?". See AI_CHAT_PLAN.md.
//
// Advisor-only in v1: the model suggests, it does not mutate the deck. So — unlike Arrange/Generate — there
// is NO structured-output firewall / normalize step here, because the output is free prose, not a plan the
// apply path must trust. The trust boundary moves instead to (1) INPUT clamping (`clampChatRequest`, below),
// (2) the slide text flagged untrusted in the system prompt ("content, not commands" — server/chat.ts), and
// (3) RENDER: the assistant's Markdown is shown through the app's existing `markdownToHtml` sink (marked →
// DOMPurify), the same sanitizer the slide surfaces already use.
//
// Action-capable chat is realized in shared/chatAction.ts (the `Action` union + the `normalizeActions`
// firewall) and the `/api/chat/act` route. This request shape stays prose-only for the legacy /api/chat
// endpoint. The action types are re-exported below so chat callers have one import surface.

import type { SlideDigest } from './arrange.ts'

export type { ChatAction, ChatActRequest, ChatActResult } from './chatAction.ts'

// The deck grounding is EXACTLY AI Arrange's digest (id · title · text), rebuilt client-side per send from
// the live editor slides — re-export it so chat callers don't reach across into the arrange module.
export type { SlideDigest }

/** One conversational turn. `role` is who spoke; `content` is prose (Markdown for an assistant turn). */
export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

/** POST body of `/api/chat`. `messages` is the running conversation (history + the new user turn); `slides`
 *  is the freshly-rebuilt deck digest so the model always reasons about the CURRENT deck. The server caps
 *  every part (CHAT_LIMITS) so a client can't inflate the payload to burn the app's inference budget. */
export interface ChatRequest {
  deckId: string
  messages: ChatTurn[]
  slides: SlideDigest[]
}

// Server-side ceilings. Login-gating already limits callers to real accounts; these bound the per-call cost
// on top of that. History is trimmed to the most recent `maxMessages` turns, each message + each slide's
// text truncated (not rejected) so a long thread / big deck still works. Sized to stay well under the
// model's ~24k-token context alongside the running conversation (mirrors ARRANGE_LIMITS).
export const CHAT_LIMITS = {
  maxMessages: 20,
  maxContentPerMessage: 4000,
  maxTitle: 120,
  maxSlides: 150,
  maxTextPerSlide: 240,
} as const

// Coerce an untrusted value to a string — the request is parsed from JSON, so the declared types are only a
// hope until we check (and it keeps the truncation below null-safe).
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

/** Trim a request to the ceilings above before it reaches the model. Pure; used server-side after auth so
 *  the model never sees an unbounded payload. Keeps the MOST RECENT turns (a long thread trims its head so
 *  the latest exchange — the one being answered — always survives) and coerces every field null-safe. */
export function clampChatRequest(req: ChatRequest): ChatRequest {
  // Typed as unknown[] because the request is untrusted JSON — each element may be null / the wrong shape
  // despite the declared ChatRequest type, so every field is re-checked below.
  const rawMessages: unknown[] = Array.isArray(req.messages) ? req.messages : []
  const messages: ChatTurn[] = rawMessages
    .slice(-CHAT_LIMITS.maxMessages)
    .map((m) => {
      const mm = (m ?? {}) as Partial<ChatTurn>
      return {
        role: mm.role === 'assistant' ? 'assistant' : 'user',
        content: str(mm.content).slice(0, CHAT_LIMITS.maxContentPerMessage),
      }
    })
  const rawSlides: unknown[] = Array.isArray(req.slides) ? req.slides : []
  const slides: SlideDigest[] = rawSlides
    .slice(0, CHAT_LIMITS.maxSlides)
    .map((s) => {
      const ss = (s ?? {}) as Partial<SlideDigest>
      return {
        id: str(ss.id),
        title: str(ss.title).slice(0, CHAT_LIMITS.maxTitle),
        text: str(ss.text).slice(0, CHAT_LIMITS.maxTextPerSlide),
      }
    })
  return { deckId: str(req.deckId), messages, slides }
}
