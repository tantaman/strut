// The client ↔ server contract for "✨ Chat" — the advisor of the ✨ family (alongside AI Arrange, which
// REORDERS slides, and AI Generate, which AUTHORS them). Chat neither reorders nor authors: it TALKS. The
// user converses with a model that can *see* the deck (grounded by append-only semantic narration from the
// live Rindle deck-detail view) and answers in streamed prose — "does this flow?", "what's a stronger
// closing?".
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

export type { ChatAction, ChatActRequest, ChatActResult } from './chatAction.ts'

/** One conversational turn. `role` is who spoke; `content` is prose (Markdown for an assistant turn). */
export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

/** POST body of `/api/chat`. `messages` is the running conversation (history + the new user turn);
 *  `deckContext` is the append-only semantic narration accumulated from the live deck-detail query. The
 *  server caps every part (CHAT_LIMITS) so a client can't inflate the payload to burn the app's inference
 *  budget. */
export interface ChatRequest {
  deckId: string
  messages: ChatTurn[]
  deckContext: string
}

// Server-side ceilings. Login-gating already limits callers to real accounts; these bound the per-call cost
// on top of that. History is trimmed to the most recent `maxMessages` turns, and the narrated deck context
// is tail-truncated (not rejected) so a long session still works. Sized to stay under the model context
// alongside the running conversation; individual narration templates also cap large fields before this.
export const CHAT_LIMITS = {
  maxMessages: 20,
  maxContentPerMessage: 4000,
  maxDeckContext: 60000,
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
  const deckContext = str(req.deckContext).slice(-CHAT_LIMITS.maxDeckContext)
  return { deckId: str(req.deckId), messages, deckContext }
}
