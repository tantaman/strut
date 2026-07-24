// The "✨ Chat" panel: a right-side rail where the user converses with an LLM about the deck they're
// editing. Reads + drives the memory-only `chat_message` local thread through useChat; the model can SEE
// the deck, answer in streamed prose, and apply normalized deck changes when the author asks.
//
// Trust boundary at render: the assistant's turn is free Markdown, so it flows through the app's existing
// `markdownToHtml` sink (marked → DOMPurify) — the SAME sanitizer the slide surfaces use — before it
// reaches dangerouslySetInnerHTML. User turns render as plain text (React escapes them). Guests see a
// sign-in nudge (the server route enforces it too), mirroring AI Arrange / Generate.

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, RotateCcw, Sparkles, Trash2, X } from 'lucide-react'
import { authClient } from '../rindle/authClient'
import { markdownToHtml } from './markdown'
import { useChat } from './aiChat'
import type { ChatMessage } from './aiChat'
import type { DeckRoot, SlideDetail } from './deckDetail'
import type { DeckChatContext } from './chatNarration'
import {
  MAX_STYLE_REFERENCE_BYTES,
  MAX_STYLE_REFERENCES,
  MAX_STYLE_REFERENCES_TOTAL_BYTES,
  STYLE_REFERENCE_MIMES,
} from '../../shared/styleReferences'

export function ChatPanel({
  deckId,
  slides,
  deck,
  activeSlide,
  deckContext,
  canEdit = false,
  styleIntent = 0,
  onClose,
}: {
  deckId: string
  slides: SlideDetail[]
  // The deck row (resolved theme + theme before-values) and the active slide (the natural body-edit
  // target) ground any chat-applied change. Null until the deck subtree resolves.
  deck: DeckRoot | null
  activeSlide: SlideDetail | null
  deckContext: DeckChatContext
  /** Secure-by-default until the deck route wires the resolved owner/collaborator permission. */
  canEdit?: boolean
  /** Incremented when Design hands off to this ambient surface. */
  styleIntent?: number
  onClose: () => void
}) {
  // Membership gate (a promoted, non-anonymous account). During the initial session resolve we treat the
  // user as a non-member (nudge shown). The route enforces the same gate server-side.
  const { data: session } = authClient.useSession()
  const isMember =
    !!session?.user &&
    (session.user as { isAnonymous?: boolean }).isAnonymous !== true

  const { messages, send, busy, clear, undoTip, undoLast } = useChat(
    deckId,
    slides,
    { deck, activeSlide, deckContext, canEdit },
  )
  const [text, setText] = useState('')
  const [references, setReferences] = useState<PendingReference[]>([])
  const [referenceError, setReferenceError] = useState<string | null>(null)
  const [draggingReferences, setDraggingReferences] = useState(false)
  const [styleReady, setStyleReady] = useState(false)
  const threadRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const previewUrls = useRef(new Set<string>())
  const referenceTurn = useRef<{
    pending: boolean
    previousAssistantId: string | null
  }>({ pending: false, previousAssistantId: null })

  // Follow the newest content as the thread grows AND as the streaming turn fills in (messages is a fresh
  // array on every token flush, so this fires per frame during a stream).
  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  useEffect(() => {
    if (isMember && canEdit && !styleIntent && hasFinePointer())
      inputRef.current?.focus()
  }, [isMember, canEdit, styleIntent])

  useEffect(() => {
    if (!styleIntent) return
    setStyleReady(true)
    setReferenceError(null)
  }, [styleIntent])

  useEffect(
    () => () => {
      for (const url of previewUrls.current) URL.revokeObjectURL(url)
      previewUrls.current.clear()
    },
    [],
  )

  useEffect(() => {
    const turn = referenceTurn.current
    if (!turn.pending) return
    const assistant = [...messages]
      .reverse()
      .find((message) => message.role === 'assistant')
    if (
      !assistant ||
      assistant.id === turn.previousAssistantId ||
      assistant.status === 'streaming'
    )
      return
    turn.pending = false
    if (assistant.status === 'done') {
      clearReferences()
      setStyleReady(false)
    }
  }, [messages])

  function addReferences(files: File[]) {
    if (busy || !canEdit) return
    const room = MAX_STYLE_REFERENCES - references.length
    if (room <= 0) {
      setReferenceError('Add up to 5 style references.')
      return
    }
    const next: PendingReference[] = []
    let total = references.reduce(
      (bytes, reference) => bytes + reference.file.size,
      0,
    )
    let error: string | null =
      files.length > room ? 'Add up to 5 style references.' : null
    for (const original of files.slice(0, room)) {
      const file = withInferredImageType(original)
      if (!file) {
        error = 'Use JPEG, PNG, or WebP images.'
        continue
      }
      if (!STYLE_REFERENCE_TYPES.has(file.type)) {
        error = 'Use JPEG, PNG, or WebP images.'
        continue
      }
      if (!file.size) {
        error = 'That image is empty.'
        continue
      }
      if (file.size > MAX_STYLE_REFERENCE_BYTES) {
        error = 'Each reference must be under 4 MB.'
        continue
      }
      if (total + file.size > MAX_STYLE_REFERENCES_TOTAL_BYTES) {
        error = 'Style references must be under 8 MB total.'
        continue
      }
      total += file.size
      const previewUrl = URL.createObjectURL(file)
      previewUrls.current.add(previewUrl)
      next.push({ id: previewUrl, file, previewUrl })
    }
    if (next.length) {
      setReferences((current) => [...current, ...next])
      setStyleReady(true)
    }
    setReferenceError(error)
  }

  function removeReference(id: string) {
    setReferences((current) => {
      const removed = current.find((reference) => reference.id === id)
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl)
        previewUrls.current.delete(removed.previewUrl)
      }
      return current.filter((reference) => reference.id !== id)
    })
    setReferenceError(null)
  }

  function clearReferences() {
    for (const reference of references) {
      URL.revokeObjectURL(reference.previewUrl)
      previewUrls.current.delete(reference.previewUrl)
    }
    setReferences([])
    setReferenceError(null)
  }

  function submit() {
    const t =
      text.trim() ||
      (references.length
        ? 'Restyle this deck using these images as visual references.'
        : '')
    if (!t || busy || !canEdit) return
    const files = references.map((reference) => reference.file)
    if (files.length) {
      referenceTurn.current = {
        pending: true,
        previousAssistantId:
          [...messages]
            .reverse()
            .find((message) => message.role === 'assistant')?.id ?? null,
      }
      send(t, files)
    } else {
      send(t)
      setStyleReady(false)
    }
    setText('')
  }

  return (
    <aside
      className={'chat' + (draggingReferences ? ' is-reference-drop' : '')}
      aria-label="AI chat"
      onDragEnter={(event) => {
        if (!isFileDrag(event.dataTransfer)) return
        event.preventDefault()
        event.stopPropagation()
        if (isMember && canEdit && !busy) setDraggingReferences(true)
      }}
      onDragOver={(event) => {
        if (!isFileDrag(event.dataTransfer)) return
        event.preventDefault()
        event.stopPropagation()
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null))
          return
        setDraggingReferences(false)
      }}
      onDrop={(event) => {
        if (!isFileDrag(event.dataTransfer)) return
        event.preventDefault()
        event.stopPropagation()
        setDraggingReferences(false)
        if (isMember && canEdit && !busy)
          addReferences(Array.from(event.dataTransfer.files))
      }}
    >
      <header className="chat__head">
        <div className="chat__title">
          <Sparkles size={15} /> Chat
        </div>
        <div className="chat__head-actions">
          <button
            className="chat__icon"
            onClick={() => {
              clear()
              clearReferences()
              setStyleReady(false)
            }}
            disabled={!canEdit || messages.length === 0}
            title="Clear chat"
          >
            <Trash2 size={15} />
          </button>
          <button className="chat__icon" onClick={onClose} title="Close chat">
            <X size={16} />
          </button>
        </div>
      </header>

      {!canEdit ? (
        <ReadOnlyGate />
      ) : !isMember ? (
        <SignInGate />
      ) : (
        <>
          <div className="chat__thread" ref={threadRef}>
            {messages.length === 0 ? (
              <div className="chat__empty">
                {styleReady ? (
                  <>
                    Drop up to five images that capture the look. Strut will
                    translate their palette, type, rhythm, and finish into one
                    reversible theme.
                  </>
                ) : (
                  <>
                    Ask for critique or tell the AI to change the deck: “does
                    this flow?”, “make the background darker”, “add three slides
                    on pricing”, “tighten this slide”.
                  </>
                )}
              </div>
            ) : (
              messages.map((m) => <ChatBubble key={m.id} message={m} />)
            )}
          </div>
          <div className="chat__foot">
            {undoTip && (
              <div className="chat__toolbar">
                <div className="chat__undo">
                  <span>Applied</span>
                  <button onClick={undoLast} title="Undo the change (⌘/Ctrl+Z)">
                    <RotateCcw size={12} /> Undo
                  </button>
                </div>
              </div>
            )}
            {references.length > 0 && (
              <div className="chat__references" aria-label="Style references">
                {references.map((reference) => (
                  <div className="chat__reference" key={reference.id}>
                    <img src={reference.previewUrl} alt={reference.file.name} />
                    <button
                      type="button"
                      onClick={() => removeReference(reference.id)}
                      disabled={busy}
                      title={`Remove ${reference.file.name}`}
                      aria-label={`Remove ${reference.file.name}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {referenceError && (
              <div className="chat__reference-error" role="alert">
                {referenceError}
              </div>
            )}
            <div className="chat__composer">
              <input
                ref={fileRef}
                className="chat__file-input"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(event) => {
                  addReferences(Array.from(event.currentTarget.files ?? []))
                  event.currentTarget.value = ''
                }}
              />
              <button
                type="button"
                className="chat__attach"
                onClick={() => fileRef.current?.click()}
                disabled={busy || references.length >= MAX_STYLE_REFERENCES}
                title="Add style references"
                aria-label="Add style references"
              >
                <ImagePlus size={17} />
              </button>
              <textarea
                ref={inputRef}
                className="chat__input"
                rows={2}
                placeholder={
                  styleReady
                    ? 'Optional: what should Strut borrow from these?'
                    : 'Ask or tell the AI what to change… (⌘/Ctrl+Enter)'
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
                className="chat__send"
                onClick={submit}
                disabled={busy || (!text.trim() && references.length === 0)}
                title="Send (⌘/Ctrl+Enter)"
              >
                {busy ? (
                  <span className="chat__spinner" aria-label="Thinking" />
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </div>
        </>
      )}
      {draggingReferences && (
        <div className="chat__drop-overlay">Drop style references</div>
      )}
    </aside>
  )
}

const STYLE_REFERENCE_TYPES = new Set<string>(STYLE_REFERENCE_MIMES)

interface PendingReference {
  id: string
  file: File
  previewUrl: string
}

function isFileDrag(dataTransfer: DataTransfer): boolean {
  return (
    Array.from(dataTransfer.types).includes('Files') ||
    dataTransfer.files.length > 0
  )
}

function hasFinePointer(): boolean {
  const matchMedia = (
    window as unknown as {
      matchMedia?: (query: string) => MediaQueryList
    }
  ).matchMedia
  return matchMedia?.('(pointer: fine)').matches ?? false
}

function withInferredImageType(file: File): File | null {
  if (STYLE_REFERENCE_TYPES.has(file.type)) return file
  if (file.type) return null
  const extension = file.name.split('.').pop()?.toLowerCase()
  const type =
    extension === 'jpg' || extension === 'jpeg'
      ? 'image/jpeg'
      : extension === 'png'
        ? 'image/png'
        : extension === 'webp'
          ? 'image/webp'
          : null
  return type
    ? new File([file], file.name, {
        type,
        lastModified: file.lastModified,
      })
    : null
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
          <div className="chat__note" role="status" aria-live="polite">
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

function ReadOnlyGate() {
  return (
    <div className="chat__gate" role="status" aria-disabled="true">
      <p className="chat__gate-text">
        AI chat is unavailable while this deck is read-only.
      </p>
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
        Sign in to chat with AI about your deck.
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
