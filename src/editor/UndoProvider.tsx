// React glue for the undo History (spec §3.7): provides one History per editor mount, a hook to grab
// the stable instance, a hook that re-renders on stack changes (for toolbar enabled state), and the
// global Cmd/Ctrl+Z (undo) / Shift+Cmd/Ctrl+Z / Ctrl+Y (redo) keyboard handler.

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { History } from './history'

const Ctx = createContext<History | null>(null)

export function useHistory(): History {
  const h = useContext(Ctx)
  if (!h) throw new Error('useHistory() used outside <UndoProvider>')
  return h
}

/** Subscribe to stack changes — returns the live { canUndo, canRedo, labels }. */
export function useHistoryState(): {
  canUndo: boolean
  canRedo: boolean
  undoLabel: string | null
  redoLabel: string | null
} {
  const h = useHistory()
  return useSyncExternalStore(
    h.subscribe,
    () => snapshot(h),
    () => EMPTY,
  )
}

interface HistorySnapshot {
  canUndo: boolean
  canRedo: boolean
  undoLabel: string | null
  redoLabel: string | null
}
const EMPTY: HistorySnapshot = {
  canUndo: false,
  canRedo: false,
  undoLabel: null,
  redoLabel: null,
}
// Memoize per-(canUndo,canRedo,labels) so useSyncExternalStore sees a stable reference between emits.
let cache: HistorySnapshot = EMPTY
function snapshot(h: History) {
  if (
    cache.canUndo === h.canUndo &&
    cache.canRedo === h.canRedo &&
    cache.undoLabel === h.undoLabel &&
    cache.redoLabel === h.redoLabel
  )
    return cache
  cache = {
    canUndo: h.canUndo,
    canRedo: h.canRedo,
    undoLabel: h.undoLabel,
    redoLabel: h.redoLabel,
  }
  return cache
}

export function UndoProvider({ children }: { children: ReactNode }) {
  const ref = useRef<History>(null)
  if (!ref.current) ref.current = new History()
  const history = ref.current

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      const key = e.key.toLowerCase()
      const isUndo = key === 'z' && !e.shiftKey
      const isRedo = (key === 'z' && e.shiftKey) || key === 'y'
      if (!isUndo && !isRedo) return
      // Don't hijack the native undo of a field the user is typing in.
      const t = e.target as HTMLElement | null
      if (
        t &&
        (t.isContentEditable ||
          t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA')
      )
        return
      e.preventDefault()
      if (isRedo) history.redo()
      else history.undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [history])

  return <Ctx.Provider value={history}>{children}</Ctx.Provider>
}
