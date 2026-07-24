// Shared editor state. The active slide is the sole durable URL location (`?slide=`), so deep links and
// Present/Esc restore reading position without encoding UI modes. Component selection and contextual
// tools stay ephemeral React state.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { getRouteApi } from '@tanstack/react-router'

// Reach the editor route's search/navigate by id (no module import → no coupling to the route file).
const editorRoute = getRouteApi('/deck/$deckId')

interface EditorState {
  deckId: string
  // Whether the current principal may mutate this deck (owner or 'editor' collaborator). A 'viewer'
  // collaborator gets a read-only editor — editing affordances are hidden and the server rejects
  // writes anyway (defense in depth).
  canEdit: boolean
  activeSlideId: string | null
  setActiveSlide: (id: string | null) => void

  selected: ReadonlySet<string>
  isSelected: (id: string) => boolean
  select: (id: string, additive?: boolean) => void
  selectMany: (ids: string[]) => void
  clearSelection: () => void

  draggingComponentId: string | null
  setDraggingComponentId: (id: string | null) => void

  // The armed shape tool for draw-to-place (tldraw/Figma style): the picked shape name
  // (square/circle/…), or null when the Select tool is active. The contextual command bar arms it;
  // Stage consumes the draw gesture and reverts it to null after one placement.
  pendingShape: string | null
  setPendingShape: (name: string | null) => void
}

const Ctx = createContext<EditorState | null>(null)

export function useEditor(): EditorState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useEditor() outside <EditorStateProvider>')
  return v
}

export function EditorStateProvider({
  deckId,
  canEdit,
  children,
}: {
  deckId: string
  canEdit: boolean
  children: ReactNode
}) {
  const search = editorRoute.useSearch()
  const navigate = editorRoute.useNavigate()
  const activeSlideId = search.slide ?? null
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(
    null,
  )
  const [pendingShape, setPendingShape] = useState<string | null>(null)

  const setActiveSlide = useCallback(
    (id: string | null) => {
      // Switching slides clears component selection (§5.2) — but keep the same empty Set when it's
      // already empty so we don't needlessly recreate the `editor` memo (and re-render consumers).
      setSelected((prev) => (prev.size ? new Set() : prev))
      void navigate({
        search: (prev) => ({ ...prev, slide: id ?? undefined }),
        replace: true,
      })
    },
    [navigate],
  )

  const select = useCallback((id: string, additive = false) => {
    setSelected((prev) => {
      if (additive) {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        return next
      }
      return new Set([id])
    })
  }, [])

  const selectMany = useCallback(
    (ids: string[]) => setSelected(new Set(ids)),
    [],
  )
  const clearSelection = useCallback(() => setSelected(new Set()), [])
  const isSelected = useCallback((id: string) => selected.has(id), [selected])

  const value = useMemo<EditorState>(
    () => ({
      deckId,
      canEdit,
      activeSlideId,
      setActiveSlide,
      selected,
      isSelected,
      select,
      selectMany,
      clearSelection,
      draggingComponentId,
      setDraggingComponentId,
      pendingShape,
      setPendingShape,
    }),
    [
      deckId,
      canEdit,
      activeSlideId,
      setActiveSlide,
      selected,
      isSelected,
      select,
      selectMany,
      clearSelection,
      draggingComponentId,
      setDraggingComponentId,
      pendingShape,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
