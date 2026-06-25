import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useQuery, useQueryStatus } from '@rindle/react'
import { deckDetailQuery, deckSharesQuery } from '../../shared/queries'
import { currentUser } from '../rindle/user'
import { EditorStateProvider, useEditor } from '../editor/EditorState'
import { UndoProvider } from '../editor/UndoProvider'
import { Header } from '../editor/Header'
import { SlideWell } from '../editor/SlideWell'
import { Stage } from '../editor/Stage'
import { Overview } from '../editor/Overview'
import type { DeckDetailSlide } from '../editor/deckDetail'

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
})

const EMPTY_SLIDES: DeckDetailSlide[] = []

function EditorPage() {
  const { deckId } = Route.useParams()
  return <EditorAccess deckId={deckId} />
}

function EditorAccess({ deckId }: { deckId: string }) {
  // The relay root: ONE useQuery of the whole deck subtree; slide nodes flow down as fragment refs.
  const deck = useQuery(deckDetailQuery({ deckId }))
  const shares = useQuery(deckSharesQuery({ deckId }))
  // Owner or 'editor' collaborator → editable; everyone else (incl. a 'viewer') → read-only. While
  // the deck row is still syncing we assume read-only so editing chrome doesn't flash for viewers.
  const me = currentUser()
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
  const deck = useQuery(deckDetailQuery({ deckId })) // deduped with EditorAccess's identical query
  const slides = deck?.slides ?? EMPTY_SLIDES
  const editor = useEditor()
  // Don't judge access until both the deck row and its shares are authoritative — otherwise canEdit is
  // momentarily false on open and the read-only banner flashes before ownership/role is known.
  const deckStatus = useQueryStatus(deckDetailQuery({ deckId }))
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

  return (
    <div className="editor">
      <Header deck={deck} />
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
      </div>
    </div>
  )
}
