// The slide well (spec §5.1): live thumbnails, click to make active, ctrl/shift-click to multi-select,
// drag to reorder (fractional index), × to delete, + to add a blank slide. Hovering the gap between
// two slides reveals a + to insert a slide there; while dragging, the gap shows a drop indicator.

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { newId, OVERVIEW_CARD_GAP } from '../config'
import { keyBetween } from '../lib/order'
import { useMutate } from '../rindle/RindleProvider'
import { authClient } from '../rindle/authClient'
import { useEditor } from './EditorState'
import { useHistory } from './UndoProvider'
import { reinsertComponent } from './componentOps'
import { applyGenerated } from './aiGenerate'
import { track } from '../lib/analytics'
import type { AnyComponent, DeckThemeFields } from './types'
import { SlideView } from './SlideView'
import type { SlideDetail } from './deckDetail'
import type { AddSlideArgs } from '../../shared/app-def'
import type { GeneratedDeck, GenerateRequest } from '../../shared/generate'

export function SlideWell({
  slides,
  deck,
}: {
  slides: SlideDetail[]
  deck:
    | ({
        background: string
        default_slide_mode?: string | null
      } & DeckThemeFields)
    | null
}) {
  const editor = useEditor()
  const mutate = useMutate()
  const history = useHistory()
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropIdx, setDropIdx] = useState<number | null>(null)
  // "✨ Generate slides": ask the AI to author N slides from a description and append them. `isMember`
  // (a promoted, non-anonymous account) gates the feature — guests see a sign-in nudge; the /api/generate
  // route enforces the same gate server-side (guests can't spend the app's inference budget). During the
  // initial session resolve we treat the user as a non-member (nudge shown).
  const { data: session } = authClient.useSession()
  const isMember =
    !!session?.user &&
    (session.user as { isAnonymous?: boolean }).isAnonymous !== true
  const [genOpen, setGenOpen] = useState(false)
  const componentsBySlideRef = useRef(
    new Map<string, Map<string, AnyComponent>>(),
  )
  const rememberSlideComponent = useCallback(
    (slideId: string, component: AnyComponent) => {
      let components = componentsBySlideRef.current.get(slideId)
      if (!components) {
        components = new Map()
        componentsBySlideRef.current.set(slideId, components)
      }
      components.set(component.id, component)
    },
    [],
  )
  const forgetSlideComponent = useCallback((slideId: string, id: string) => {
    const components = componentsBySlideRef.current.get(slideId)
    components?.delete(id)
    if (components?.size === 0) componentsBySlideRef.current.delete(slideId)
  }, [])
  const componentsForSlide = useCallback((slideId: string) => {
    return [
      ...(componentsBySlideRef.current.get(slideId)?.values() ?? []),
    ].sort((a, b) => a.z_order - b.z_order)
  }, [])
  const slideAt = (index: number): SlideDetail | undefined =>
    index >= 0 && index < slides.length ? slides[index] : undefined

  function thumbnailForSlide(s: SlideDetail) {
    return (
      <SlideView
        slide={s}
        deck={deck}
        width={148}
        onComponentData={(component) => rememberSlideComponent(s.id, component)}
        onComponentRemove={(id) => forgetSlideComponent(s.id, id)}
      />
    )
  }

  // Insert a blank slide so it lands at index `at` (0 = before the first slide, slides.length =
  // append). The fractional sort key falls between the neighbors; the 3-D overview position is
  // placed near them too (midpoint when inserting between, one gap past the end when appending).
  function addSlideAt(at: number) {
    const before = slideAt(at - 1)
    const after = slideAt(at)
    const id = newId()
    const between = (
      b: number | undefined,
      a: number | undefined,
      fallback: number,
    ) =>
      b != null && a != null
        ? Math.round((b + a) / 2)
        : b != null
          ? b + OVERVIEW_CARD_GAP
          : a != null
            ? a - OVERVIEW_CARD_GAP
            : fallback
    const args: AddSlideArgs = {
      id,
      deckId: editor.deckId,
      sort: keyBetween(before?.sort, after?.sort),
      x: between(before?.x, after?.x, 0),
      y: between(before?.y, after?.y, 0),
      // New slides inherit the deck's default render mode (spec: deck-level markdown default).
      render_mode: deck?.default_slide_mode === 'markdown' ? 'markdown' : '',
      now: Date.now(),
    }
    mutate.addSlide(args)
    editor.setActiveSlide(id)
    history.push({
      label: 'Add slide',
      redo: () => mutate.addSlide(args),
      undo: () => mutate.deleteSlide({ id, componentIds: [] }),
    })
  }

  const addSlide = () => addSlideAt(slides.length)

  // Append the AI-generated slides (one undo for the whole batch) and jump to the first new one.
  function handleGenerated(generated: GeneratedDeck) {
    const firstId = applyGenerated(
      generated,
      mutate,
      { deckId: editor.deckId, slides },
      history,
    )
    if (firstId) editor.setActiveSlide(firstId)
    track('slides:generated', { count: generated.slides.length })
    setGenOpen(false)
  }

  // Restore a deleted slide (row + transform + theme + all its components).
  function restoreSlide(s: SlideDetail, comps: AnyComponent[]) {
    const now = Date.now()
    mutate.addSlide({
      id: s.id,
      deckId: s.deck_id,
      sort: s.sort,
      x: s.x,
      y: s.y,
      render_mode: s.render_mode,
      now,
    })
    mutate.setSlideTransform({
      id: s.id,
      x: s.x,
      y: s.y,
      z: s.z,
      rotate_x: s.rotate_x,
      rotate_y: s.rotate_y,
      rotate_z: s.rotate_z,
      imp_scale: s.imp_scale,
      now,
    })
    if (s.background || s.surface || s.text_align)
      mutate.setSlideTheme({
        id: s.id,
        background: s.background,
        surface: s.surface,
        text_align: s.text_align,
        now,
      })
    if (s.doc) mutate.setSlideDoc({ id: s.id, doc: s.doc, now })
    for (const c of comps) reinsertComponent(mutate, c)
  }

  function deleteSlide(s: SlideDetail, idx: number) {
    // Snapshot components first so undo can restore them — the server cascades component rows by
    // slide_id (see RINDLE_NOTES.md cascade), so once deleted they're gone unless we re-add them. The
    // snapshot uses the latest leaf fragment data registered by the thumbnail component readers.
    const comps = componentsForSlide(s.id)
    const componentIds = comps.map((c) => c.id)
    const del = () => mutate.deleteSlide({ id: s.id, componentIds })
    del()
    history.push({
      label: 'Delete slide',
      redo: del,
      undo: () => restoreSlide(s, comps),
    })
    if (editor.activeSlideId === s.id) {
      const neighbor = slideAt(idx + 1) ?? slideAt(idx - 1)
      editor.setActiveSlide(neighbor ? neighbor.id : null)
    }
  }

  function endDrag() {
    setDragId(null)
    setDropIdx(null)
  }

  // `at` is an insertion index into the current `slides` array (0 = before first, n = end).
  function drop(at: number) {
    if (!dragId) return endDrag()
    const fromIdx = slides.findIndex((s) => s.id === dragId)
    // Dropping into its own slot (just before or just after itself) is a no-op.
    if (fromIdx === -1 || at === fromIdx || at === fromIdx + 1) return endDrag()
    const moving = slides[fromIdx]
    const without = slides.filter((s) => s.id !== dragId)
    const insIdx = at > fromIdx ? at - 1 : at
    const before =
      insIdx - 1 >= 0 && insIdx - 1 < without.length
        ? without[insIdx - 1]
        : undefined
    const after =
      insIdx >= 0 && insIdx < without.length ? without[insIdx] : undefined
    const sort = keyBetween(before?.sort, after?.sort)
    const fromSort = moving.sort
    mutate.reorderSlide({ id: dragId, sort })
    if (fromSort !== sort) {
      const id = dragId
      history.push({
        label: 'Reorder slide',
        redo: () => mutate.reorderSlide({ id, sort }),
        undo: () => mutate.reorderSlide({ id, sort: fromSort }),
      })
    }
    endDrag()
  }

  // The gap affordance at insertion index `at`: a hover "+" to add a slide there, and — while a drag
  // is in progress — a drop target that lights up when it's where the slide would land.
  function inserter(at: number) {
    if (!editor.canEdit) return null
    const dragging = dragId !== null
    return (
      <div
        key={`ins-${at}`}
        className={
          'well__ins' +
          (dragging ? ' is-dragging' : '') +
          (dragging && dropIdx === at ? ' is-drop-target' : '')
        }
        onDragOver={(e) => {
          if (!dragging) return
          e.preventDefault()
          setDropIdx(at)
        }}
        onDrop={() => drop(at)}
      >
        <span className="well__ins-line" />
        <button
          className="well__ins-btn"
          title="Add a slide here"
          onClick={(e) => {
            e.stopPropagation()
            addSlideAt(at)
          }}
        >
          <Plus size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="well">
      {slides.map((s, i) => (
        <Fragment key={s.id}>
          {inserter(i)}
          <div
            className={
              'well__slide' +
              (editor.activeSlideId === s.id ? ' is-active' : '') +
              (editor.isSelected(s.id) ? ' is-selected' : '') +
              (dragId === s.id ? ' is-dragging' : '')
            }
            draggable={editor.canEdit}
            onDragStart={() => editor.canEdit && setDragId(s.id)}
            onDragEnd={endDrag}
            onDragOver={(e) => {
              if (!editor.canEdit || !dragId) return
              e.preventDefault()
              // Top half drops before this slide, bottom half after it.
              const r = e.currentTarget.getBoundingClientRect()
              setDropIdx(e.clientY > r.top + r.height / 2 ? i + 1 : i)
            }}
            onDrop={() => editor.canEdit && drop(dropIdx ?? i)}
            onClick={() => editor.setActiveSlide(s.id)}
          >
            <div className="well__thumb">{thumbnailForSlide(s)}</div>
            <span className="well__badge">{i + 1}</span>
            {editor.canEdit && (
              <button
                className="well__del"
                title="Delete slide"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSlide(s, i)
                }}
              >
                ×
              </button>
            )}
          </div>
        </Fragment>
      ))}
      {inserter(slides.length)}
      {editor.canEdit && (
        <button
          className="well__add"
          onClick={addSlide}
          onDragOver={(e) => {
            if (!dragId) return
            e.preventDefault()
            setDropIdx(slides.length)
          }}
          onDrop={() => drop(slides.length)}
        >
          <Plus size={16} /> Slide
        </button>
      )}
      {editor.canEdit && (
        <div className="well__gen">
          {genOpen ? (
            <GenerateForm
              deckId={editor.deckId}
              isMember={isMember}
              onGenerated={handleGenerated}
              onClose={() => setGenOpen(false)}
            />
          ) : (
            <button
              className="well__gen-toggle"
              onClick={() => setGenOpen(true)}
              title="Ask AI to generate slides from a description"
            >
              <Sparkles size={15} /> Generate slides
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// The "✨ Generate slides" form: a natural-language description → POST /api/generate → hand the returned
// deck up to be appended. For an anonymous (guest) user it renders a sign-in nudge instead — the toggle is
// visible to everyone (discoverability) but the feature is member-gated (the route enforces it too).
// Sign-in returns to the current deck so in-progress work + the guest's decks carry over on promotion.
function GenerateForm({
  deckId,
  isMember,
  onGenerated,
  onClose,
}: {
  deckId: string
  isMember: boolean
  onGenerated: (deck: GeneratedDeck) => void
  onClose: () => void
}) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // Focus the prompt the moment the panel opens so the user can just start typing.
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  if (!isMember) {
    const back =
      typeof window !== 'undefined'
        ? window.location.pathname + window.location.search
        : '/'
    return (
      <div className="well__gen-panel">
        <div className="well__gen-gate">Sign in to generate slides with AI</div>
        <div className="well__gen-signin">
          <button
            onClick={() =>
              authClient.signIn.social({
                provider: 'github',
                callbackURL: back,
              })
            }
          >
            GitHub
          </button>
          <button
            onClick={() =>
              authClient.signIn.social({
                provider: 'google',
                callbackURL: back,
              })
            }
          >
            Google
          </button>
        </div>
        <button className="well__gen-close" onClick={onClose}>
          Cancel
        </button>
      </div>
    )
  }

  async function submit() {
    if (loading || !prompt.trim()) return
    setLoading(true)
    setError(null)
    try {
      const body: GenerateRequest = { deckId, prompt }
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const b = (await res.json().catch(() => null)) as {
          message?: string
        } | null
        setError(
          res.status === 401
            ? 'Sign in to generate slides.'
            : // Prefer the server's message (e.g. the daily-quota notice); fall back per status.
              (b?.message ??
                (res.status === 429
                  ? 'Too many requests — wait a moment.'
                  : 'AI is unavailable right now.')),
        )
        return
      }
      const deck = (await res.json()) as GeneratedDeck
      if (!Array.isArray(deck.slides) || deck.slides.length === 0) {
        setError('No slides came back — try rephrasing.')
        return
      }
      onGenerated(deck)
      setPrompt('')
    } catch {
      setError('Network error — try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="well__gen-panel">
      <textarea
        ref={inputRef}
        className="well__gen-input"
        rows={3}
        placeholder="Describe your slides — e.g. “6 slides introducing our Q3 roadmap”"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          // Enter alone is a newline in the textarea; ⌘/Ctrl+Enter submits, Escape closes.
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            submit()
          } else if (e.key === 'Escape') onClose()
        }}
        disabled={loading}
      />
      {error && <div className="well__gen-error">{error}</div>}
      <div className="well__gen-actions">
        <button
          className="well__gen-go"
          onClick={submit}
          disabled={loading || !prompt.trim()}
          title="Generate slides (⌘/Ctrl+Enter)"
        >
          {loading ? (
            <span className="well__gen-spinner" aria-label="Generating" />
          ) : (
            <>
              <Sparkles size={14} /> Generate
            </>
          )}
        </button>
        <button
          className="well__gen-close"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
