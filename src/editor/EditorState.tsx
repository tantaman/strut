// Ephemeral editor state (NOT persisted — spec lets selection be ephemeral, §3.2). Active slide,
// component multi-selection, and the slide/overview mode, shared across the editor via context.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type EditorMode = 'slide' | 'overview'

interface EditorState {
  deckId: string
  // Whether the current principal may mutate this deck (owner or 'editor' collaborator). A 'viewer'
  // collaborator gets a read-only editor — editing affordances are hidden and the server rejects
  // writes anyway (defense in depth).
  canEdit: boolean
  activeSlideId: string | null
  setActiveSlide: (id: string | null) => void

  mode: EditorMode
  setMode: (m: EditorMode) => void

  selected: ReadonlySet<string>
  isSelected: (id: string) => boolean
  select: (id: string, additive?: boolean) => void
  selectMany: (ids: string[]) => void
  clearSelection: () => void
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
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null)
  const [mode, setMode] = useState<EditorMode>('slide')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const setActiveSlide = useCallback((id: string | null) => {
    setActiveSlideId(id)
    setSelected(new Set()) // switching slides clears component selection (§5.2)
  }, [])

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

  const selectMany = useCallback((ids: string[]) => setSelected(new Set(ids)), [])
  const clearSelection = useCallback(() => setSelected(new Set()), [])
  const isSelected = useCallback((id: string) => selected.has(id), [selected])

  const value = useMemo<EditorState>(
    () => ({
      deckId,
      canEdit,
      activeSlideId,
      setActiveSlide,
      mode,
      setMode,
      selected,
      isSelected,
      select,
      selectMany,
      clearSelection,
    }),
    [deckId, canEdit, activeSlideId, setActiveSlide, mode, selected, isSelected, select, selectMany, clearSelection],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
