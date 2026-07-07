// The "✨ Chat" advisor panel (AI_CHAT_PLAN.md): a right-side rail where the user converses with an LLM
// about the deck they're editing. Reads + drives the memory-only `chat_message` local thread through
// useChat; the model can SEE the deck (grounded via buildDigest) and answers in streamed prose.
//
// Trust boundary at render: the assistant's turn is free Markdown, so it flows through the app's existing
// `markdownToHtml` sink (marked → DOMPurify) — the SAME sanitizer the slide surfaces use — before it
// reaches dangerouslySetInnerHTML. User turns render as plain text (React escapes them). Guests see a
// sign-in nudge (the feature is member-gated — the /api/chat route enforces it too — but discoverable to
// everyone), mirroring AI Arrange / Generate.

import { useEffect, useRef, useState } from 'react'
import { RotateCcw, Sparkles, Trash2, X } from 'lucide-react'
import { authClient } from '../rindle/authClient'
import { track } from '../lib/analytics'
import { markdownToHtml } from './markdown'
import { useChat } from './aiChat'
import type { ChatMessage } from './aiChat'
import type { DeckRoot, SlideDetail } from './deckDetail'

export function ChatPanel({
  deckId,
  slides,
  deck,
  activeSlide,
  onClose,
}: {
  deckId: string
  slides: SlideDetail[]
  // The deck row (resolved theme + theme before-values) and the active slide (the natural body-edit
  // target) ground + apply the Edit lane. Null until the deck subtree resolves.
  deck: DeckRoot | null
  activeSlide: SlideDetail | null
  onClose: () => void
}) {
  // Membership gate (a promoted, non-anonymous account). During the initial session resolve we treat the
  // user as a non-member (nudge shown). The route enforces the same gate server-side.
  const { data: session } = authClient.useSession()
  const isMember =
    !!session?.user &&
    (session.user as { isAnonymous?: boolean }).isAnonymous !== true

  const { messages, send, sendEdit, busy, clear, undoTip, undoLast } = useChat(
    deckId,
    slides,
    { deck, activeSlide },
  )
  // Two lanes (AI_CHAT_TOOLS_PLAN.md fork A): 'chat' = the streamed advisor (read-only), 'edit' = the AI
  // drives one deck change. The mode is an explicit affordance so the "AI is about to change my deck"
  // boundary is visible.
  const [mode, setMode] = useState<'chat' | 'edit'>('chat')
  const [text, setText] = useState('')
  const threadRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Follow the newest content as the thread grows AND as the streaming turn fills in (messages is a fresh
  // array on every token flush, so this fires per frame during a stream).
  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  useEffect(() => {
    if (isMember) inputRef.current?.focus()
  }, [isMember])

  function submit() {
    const t = text.trim()
    if (!t || busy) return
    if (mode === 'edit') {
      // sendEdit records its own 'chat:edit' event (and dispatches the applied action).
      sendEdit(t)
    } else {
      send(t)
      // Interaction-only: how many slides the advisor is grounded on. Never the prompt or slide content.
      track('chat:sent', { slides: slides.length })
    }
    setText('')
  }

  return (
    <aside className="chat" aria-label="AI advisor">
      <header className="chat__head">
        <div className="chat__title">
          <Sparkles size={15} /> Advisor
        </div>
        <div className="chat__head-actions">
          <button
            className="chat__icon"
            onClick={clear}
            disabled={messages.length === 0}
            title="Clear chat"
          >
            <Trash2 size={15} />
          </button>
          <button className="chat__icon" onClick={onClose} title="Close chat">
            <X size={16} />
          </button>
        </div>
      </header>

      {!isMember ? (
        <SignInGate />
      ) : (
        <>
          <div className="chat__thread" ref={threadRef}>
            {messages.length === 0 ? (
              <div className="chat__empty">
                <strong>Chat</strong> to talk it through — does this flow?
                what’s a stronger closing? Switch to <strong>Edit</strong> and
                the AI changes your deck: “make the background darker”, “add
                three slides on pricing”, “tighten this slide”.
              </div>
            ) : (
              messages.map((m) => <ChatBubble key={m.id} message={m} />)
            )}
          </div>
          <div className="chat__foot">
            <div className="chat__toolbar">
              <div className="chat__modes" role="group" aria-label="Mode">
                <button
                  className={mode === 'chat' ? 'is-active' : ''}
                  onClick={() => setMode('chat')}
                  title="Ask for advice (read-only)"
                  aria-pressed={mode === 'chat'}
                >
                  Chat
                </button>
                <button
                  className={mode === 'edit' ? 'is-active' : ''}
                  onClick={() => setMode('edit')}
                  title="Tell the AI to change your deck"
                  aria-pressed={mode === 'edit'}
                >
                  <Sparkles size={12} /> Edit
                </button>
              </div>
              {undoTip && (
                <div className="chat__undo">
                  <span>Applied</span>
                  <button onClick={undoLast} title="Undo the change (⌘/Ctrl+Z)">
                    <RotateCcw size={12} /> Undo
                  </button>
                </div>
              )}
            </div>
            <div className="chat__composer">
              <textarea
                ref={inputRef}
                className="chat__input"
                rows={2}
                placeholder={
                  mode === 'edit'
                    ? 'Tell the AI what to change… (⌘/Ctrl+Enter)'
                    : 'Ask your advisor… (⌘/Ctrl+Enter to send)'
                }
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  // Enter alone is a newline; ⌘/Ctrl+Enter sends (matches the Generate composer).
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    submit()
                  }
                }}
              />
              <button
                className={
                  'chat__send' + (mode === 'edit' ? ' chat__send--edit' : '')
                }
                onClick={submit}
                disabled={busy || !text.trim()}
                title="Send (⌘/Ctrl+Enter)"
              >
                {busy ? (
                  <span className="chat__spinner" aria-label="Thinking" />
                ) : mode === 'edit' ? (
                  'Edit'
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  )
}

/** One thread turn. User turns are plain-text bubbles on the right; assistant turns render Markdown
 *  (sanitized) on the left, with a typing caret while streaming and error styling on failure. */
function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="chat__msg chat__msg--user">
        <div className="chat__bubble chat__bubble--user">{message.content}</div>
      </div>
    )
  }

  const streaming = message.status === 'streaming'
  const errored = message.status === 'error'
  const bubbleClass =
    'chat__bubble chat__bubble--assistant' +
    (errored ? ' chat__bubble--error' : '')

  return (
    <div className="chat__msg chat__msg--assistant">
      <div className={bubbleClass}>
        {message.content ? (
          <div
            className="chat__md"
            // Assistant Markdown → sanitized HTML (marked → DOMPurify), the app's only such sink.
            dangerouslySetInnerHTML={{
              __html: markdownToHtml(message.content),
            }}
          />
        ) : streaming && !message.note ? (
          <span className="chat__dots" aria-label="Thinking">
            <span />
            <span />
            <span />
          </span>
        ) : null}
        {streaming && message.content && !message.note ? (
          <span className="chat__caret" />
        ) : null}
        {streaming && message.note ? (
          <div className="chat__note">
            <span className="chat__dots" aria-hidden>
              <span />
              <span />
              <span />
            </span>
            <span>{message.note}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/** Guest nudge — same GitHub/Google sign-in as AI Arrange / Generate. Sign-in returns to the current deck
 *  so in-progress work + the guest's decks carry over on promotion. */
function SignInGate() {
  const back =
    typeof window !== 'undefined'
      ? window.location.pathname + window.location.search
      : '/'
  return (
    <div className="chat__gate">
      <p className="chat__gate-text">
        Sign in to chat with an AI advisor about your deck.
      </p>
      <div className="chat__gate-signin">
        <button
          onClick={() =>
            authClient.signIn.social({ provider: 'github', callbackURL: back })
          }
        >
          GitHub
        </button>
        <button
          onClick={() =>
            authClient.signIn.social({ provider: 'google', callbackURL: back })
          }
        >
          Google
        </button>
      </div>
    </div>
  )
}
