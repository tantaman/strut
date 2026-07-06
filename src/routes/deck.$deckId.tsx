import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useQuery, useQueryStatus, useRoot } from '@rindle/react'
import { deckDetailQuery, deckSharesQuery } from '../../shared/queries'
import { authClient } from '../rindle/authClient'
import { preloadDeck } from '../rindle/appSsr'
import { EditorStateProvider, useEditor } from '../editor/EditorState'
import { UndoProvider } from '../editor/UndoProvider'
import { Header } from '../editor/Header'
import { SlideWell } from '../editor/SlideWell'
import { Stage } from '../editor/Stage'
import { Overview } from '../editor/Overview'
import { ChatPanel } from '../editor/ChatPanel'
import type { DeckRoot, SlideDetail } from '../editor/deckDetail'

export const Route = createFileRoute('/deck/$deckId')({
  component: EditorPage,
  // The editor view + active slide live here so they're deep-linkable and survive Present (§5).
  // Both optional → existing links (`/deck/:id` with no search) keep working; defaults applied on read.
  validateSearch: (
    s: Record<string, unknown>,
  ): { view?: 'slide' | 'overview'; slide?: string } => ({
    view:
      s.view === 'overview'
        ? 'overview'
        : s.view === 'slide'
          ? 'slide'
          : undefined,
    slide: typeof s.slide === 'string' ? s.slide : undefined,
  }),
  // SSR seed: read the deck subtree + collaborators on the server so a direct load / reload of the
  // editor first-paints with the deck instead of "Connecting…". Gated to the viewer's session; a deck
  // they can't see seeds empty. Returns { rindle, userId } — the userId lets canEdit resolve correctly
  // during SSR (no read-only-banner flash). Best-effort — a null seed falls back to the live query.
  loader: ({ params }) => preloadDeck({ data: { deckId: params.deckId } }),
})

const EMPTY_SLIDES: SlideDetail[] = []

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

  // The advisor rail is a per-editor, ephemeral toggle (not URL-persisted — a private side conversation).
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="editor">
      <Header
        deck={deck}
        activeSlide={activeSlide}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((o) => !o)}
      />
      {accessResolved && !editor.canEdit && (
        <div className="ro-banner">
          👁 Read-only — you’re viewing this shared deck. Changes are disabled.
        </div>
      )}
      <div className="editor__body">
        {editor.mode === 'slide' ? (
          <>
            <SlideWell slides={slides} deck={deck} />
            {activeSlide ? (
              <Stage slide={activeSlide} deck={deck} />
            ) : (
              <div className="stage">
                <div className="stage__empty">
                  No slides yet — add one in the well.
                </div>
              </div>
            )}
          </>
        ) : (
          <Overview slides={slides} deck={deck} />
        )}
        {chatOpen && (
          <ChatPanel
            deckId={deckId}
            slides={slides}
            onClose={() => setChatOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
