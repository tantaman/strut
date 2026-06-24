import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useQuery } from '@rindle/react'
import { deckQuery, deckSharesQuery, slidesQuery } from '../../shared/queries'
import { currentUser } from '../rindle/user'
import { EditorStateProvider, useEditor } from '../editor/EditorState'
import { UndoProvider } from '../editor/UndoProvider'
import { Header } from '../editor/Header'
import { SlideWell } from '../editor/SlideWell'
import { Stage } from '../editor/Stage'
import { Overview } from '../editor/Overview'

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

interface DeckRow {
  id: string
  title: string
  background: string
  surface: string
  canned_transition: string
  custom_stylesheet: string
  owner_id: string
  visibility: string
  share_token: string
}
interface ShareRow {
  id: string
  user_id: string
  role: string
}
interface FullSlide {
  id: string
  deck_id: string
  sort: string
  x: number
  y: number
  z: number
  rotate_x: number
  rotate_y: number
  rotate_z: number
  imp_scale: number
  background: string
  surface: string
}

function EditorPage() {
  const { deckId } = Route.useParams()
  const deck = useQuery(deckQuery({ deckId })) as unknown as DeckRow | null
  const shares = useQuery(deckSharesQuery({ deckId })) as unknown as ShareRow[]
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
  const deck = useQuery(deckQuery({ deckId })) as unknown as DeckRow | null
  const slides = useQuery(slidesQuery({ deckId })) as unknown as FullSlide[]
  const editor = useEditor()

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
      {!editor.canEdit && (
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
