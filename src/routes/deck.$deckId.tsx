import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useQuery, useQueryStatus, useRoot } from '@rindle/react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import {
  deckDetailQuery,
  deckSharesQuery,
  deckVariantsQuery,
} from '../../shared/queries'
import { authClient } from '../rindle/authClient'
import { preloadDeck } from '../rindle/appSsr'
import { EditorStateProvider, useEditor } from '../editor/EditorState'
import { parseEditorSearch } from '../editor/editorSearch'
import { UndoProvider } from '../editor/UndoProvider'
import { Header } from '../editor/Header'
import { Stage } from '../editor/Stage'
import { DocView } from '../editor/DocView'
import { ArrangeView } from '../editor/Overview'
import { ChatPanel } from '../editor/ChatPanel'
import { PoweredByRindle } from '../editor/PoweredByRindle'
import { useDeckChatContext } from '../editor/chatNarration'
import type { DeckRoot, SlideDetail } from '../editor/deckDetail'

export const Route = createFileRoute('/deck/$deckId')({
  component: EditorPage,
  // A deck always opens the editor. Only reading position is durable; legacy `view` data is ignored.
  validateSearch: parseEditorSearch,
  // SSR seed: read the deck subtree + collaborators on the server so a direct load / reload of the
  // editor first-paints with the deck instead of "Connecting…". Gated to the viewer's session; a deck
  // they can't see seeds empty. Returns { rindle, userId } — the userId lets canEdit resolve correctly
  // during SSR (no read-only-banner flash). Best-effort — a null seed falls back to the live query.
  loader: ({ params }) => preloadDeck({ data: { deckId: params.deckId } }),
})

const EMPTY_SLIDES: SlideDetail[] = []

type ActiveTool =
  | { kind: 'objects'; slideId: string }
  | { kind: 'arrange' }
  | null

function EditorPage() {
  const { deckId } = Route.useParams()
  return <EditorAccess deckId={deckId} />
}

function EditorAccess({ deckId }: { deckId: string }) {
  // The relay root: one sync query for the deck subtree; component children are local fragment refs.
  const [deckRaw] = useRoot(deckDetailQuery, { deckId })
  const deck = deckRaw as DeckRoot | null
  const shares = useQuery(deckSharesQuery({ deckId }))
  // Owner or 'editor' collaborator → editable; everyone else (incl. a 'viewer') → read-only. While
  // the deck row is still syncing we assume read-only so editing chrome doesn't flash for viewers.
  // `me` is the session principal (matches the server-side owner_id). It comes from the LOADER (resolved
  // server-side from the cookie) so canEdit is correct during SSR + first paint — no read-only flash;
  // the live session hook takes over after hydration (and reflects a mid-session guest→account promote).
  const { userId: ssrUserId } = Route.useLoaderData()
  const me = authClient.useSession().data?.user.id ?? ssrUserId
  const canEdit =
    !!deck &&
    (deck.owner_id === me ||
      shares.some((s) => s.user_id === me && s.role === 'editor'))
  return (
    <EditorStateProvider deckId={deckId} canEdit={canEdit}>
      <UndoProvider>
        <EditorInner deckId={deckId} />
      </UndoProvider>
    </EditorStateProvider>
  )
}

function EditorInner({ deckId }: { deckId: string }) {
  const [deckRaw, { status: deckStatus }] = useRoot(deckDetailQuery, {
    deckId,
  }) // deduped with EditorAccess's identical query
  const deck = deckRaw as DeckRoot | null
  const slides = deck?.slides ?? EMPTY_SLIDES
  const editor = useEditor()
  // Don't judge access until both the deck row and its shares are authoritative — otherwise canEdit is
  // momentarily false on open and the read-only banner flashes before ownership/role is known.
  const sharesStatus = useQueryStatus(deckSharesQuery({ deckId }))
  const accessResolved = deckStatus !== 'unknown' && sharesStatus !== 'unknown'
  const variants = useQuery(deckVariantsQuery({ deckId, limit: 5 }))
  const { entitlement } = Route.useLoaderData()
  const deckContext = useDeckChatContext(deckId)
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  // Canonicalize old deep links after hydration. Their slide location remains valid, but `?view=` no
  // longer represents product state and should disappear the first time the deck opens.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.has('view')) return
    void navigate({ search: { slide: search.slide }, replace: true })
  }, [navigate, search.slide])

  // Keep exactly one active slide (spec §3.2). While slides are still loading (empty) we leave the
  // URL's `?slide=` untouched so a deep-linked / Present-restored slide isn't clobbered before it
  // resolves; once slides exist we default to the first if the active one is missing/invalid.
  useEffect(() => {
    if (slides.length === 0) return
    if (
      !editor.activeSlideId ||
      !slides.some((s) => s.id === editor.activeSlideId)
    ) {
      editor.setActiveSlide(slides[0].id)
    }
    // Depend only on what we read — NOT the whole `editor` object. `setActiveSlide` clears the
    // selection (new Set ⇒ new `editor` memo), so depending on `editor` would re-fire this effect
    // before the URL navigation resolves, calling setActiveSlide in a loop.
  }, [slides, editor.activeSlideId, editor.setActiveSlide])

  const activeSlide = slides.find((s) => s.id === editor.activeSlideId) ?? null

  // Contextual tools are editor-local overlays. The card column stays mounted behind them, preserving
  // scroll/caret state without introducing route or URL state.
  const [activeTool, setActiveTool] = useState<ActiveTool>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [styleIntent, setStyleIntent] = useState(0)
  const [controlsOpen, setControlsOpen] = useState(false)
  const topDockRef = useRef<HTMLDivElement>(null)
  const objectSlide =
    activeTool?.kind === 'objects'
      ? (slides.find((s) => s.id === activeTool.slideId) ?? null)
      : null
  const arrangeOpen = activeTool?.kind === 'arrange'

  // The dock animates with `top`, not a CSS transform: transformed ancestors capture fixed-position
  // descendants, which would turn Header's viewport dialogs and mobile sheets into header-sized panels.
  // Measure the real responsive bar so its collapsed offset and the object canvas's clearance stay exact.
  useLayoutEffect(() => {
    const dock = topDockRef.current
    const header = dock?.querySelector<HTMLElement>('.hdr')
    const shell = dock?.parentElement
    if (!dock || !header || !shell) return
    const measure = () => {
      const height = header.offsetHeight
      dock.style.setProperty(
        '--editor-dock-offset',
        `${Math.max(0, height - 5)}px`,
      )
      shell.style.setProperty('--editor-dock-height', `${height}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(header)
    return () => {
      observer.disconnect()
      shell.style.removeProperty('--editor-dock-height')
    }
  }, [])

  // Shape placement belongs to the focused object canvas. Leaving that context by Back, Esc, Chat,
  // Arrange, or slide deletion must never leave an invisible tool armed for the next visit.
  useEffect(() => {
    if (activeTool?.kind !== 'objects' && editor.pendingShape)
      editor.setPendingShape(null)
  }, [activeTool?.kind, editor.pendingShape, editor.setPendingShape])

  useEffect(() => {
    if (
      activeTool?.kind === 'objects' &&
      slides.length > 0 &&
      !slides.some((slide) => slide.id === activeTool.slideId)
    )
      setActiveTool(null)
  }, [activeTool, slides])

  useEffect(() => {
    if (!activeTool && !chatOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      const target = event.target as HTMLElement | null
      if (
        target?.isContentEditable ||
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        editor.pendingShape
      )
        return
      event.preventDefault()
      if (activeTool) setActiveTool(null)
      else {
        setChatOpen(false)
        setStyleIntent(0)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeTool, chatOpen, editor.pendingShape])

  const closeChat = () => {
    setChatOpen(false)
    setStyleIntent(0)
  }

  const toggleChat = () => {
    setControlsOpen(false)
    setActiveTool(null)
    setStyleIntent(0)
    setChatOpen((open) => !open)
  }

  const openStyle = () => {
    setControlsOpen(false)
    setActiveTool(null)
    setChatOpen(true)
    setStyleIntent((intent) => intent + 1)
  }

  const toggleArrange = () => {
    setControlsOpen(false)
    closeChat()
    setActiveTool((tool) =>
      tool?.kind === 'arrange' ? null : { kind: 'arrange' },
    )
  }

  const editObjects = (slideId: string) => {
    setControlsOpen(false)
    closeChat()
    editor.setActiveSlide(slideId)
    setActiveTool({ kind: 'objects', slideId })
  }

  return (
    <div className="editor">
      <div
        ref={topDockRef}
        className={
          'editor__topdock' +
          (controlsOpen ? ' is-open' : '') +
          (objectSlide ? ' is-pinned' : '')
        }
      >
        <Header
          deck={deck}
          activeSlide={objectSlide ?? activeSlide}
          variants={variants}
          makesPublic={entitlement?.canKeepPrivate === false}
          editingObjects={objectSlide != null}
          onCloseObjects={() => setActiveTool(null)}
          arrangeOpen={arrangeOpen}
          onToggleArrange={toggleArrange}
          chatOpen={chatOpen}
          onToggleChat={toggleChat}
          onOpenStyle={openStyle}
        />
        {!objectSlide && (
          <button
            type="button"
            className="editor__dock-toggle"
            title={
              controlsOpen ? 'Hide editor controls' : 'Show editor controls'
            }
            aria-label={
              controlsOpen ? 'Hide editor controls' : 'Show editor controls'
            }
            aria-expanded={controlsOpen}
            onClick={(event) => {
              if (controlsOpen) event.currentTarget.blur()
              setControlsOpen(!controlsOpen)
            }}
          >
            {controlsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>
      {accessResolved && !editor.canEdit && (
        <div className="ro-banner">
          👁 Read-only — you’re viewing this shared deck. Changes are disabled.
        </div>
      )}
      <div className="editor__body">
        <DocView slides={slides} deck={deck} onEditObjects={editObjects} />
        {objectSlide && (
          <div className="context-tool context-tool--objects">
            <Stage slide={objectSlide} deck={deck} />
            <div className="context-tool__hint">
              Move, resize, or use the command bar to add objects · Esc returns
            </div>
          </div>
        )}
        {arrangeOpen && (
          <div className="context-tool context-tool--arrange">
            <ArrangeView slides={slides} deck={deck} />
            <ContextClose
              label="Back to deck"
              onClick={() => setActiveTool(null)}
            />
          </div>
        )}
        {chatOpen && (
          <ChatPanel
            deckId={deckId}
            slides={slides}
            deck={deck}
            activeSlide={activeSlide}
            deckContext={deckContext}
            canEdit={editor.canEdit}
            styleIntent={styleIntent}
            onClose={closeChat}
          />
        )}
      </div>
      {!arrangeOpen && <PoweredByRindle />}
    </div>
  )
}

function ContextClose({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="context-tool__close"
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      <X size={18} />
    </button>
  )
}
