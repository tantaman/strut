// Per-deck editor preferences, persisted on THIS device via the `deck_pref` local-only table
// (localSchema.ts). Today that's just `chat_open` — whether the ✨ Chat panel was open — so reopening a
// deck lands you where you left it instead of always closed.
//
// The read is a live materialized view over the local table (the same shape as the ✨ Chat thread's own
// read in aiChat.ts). The write is a `store.writeLocal` UPSERT: the store-level tx exposes add/edit/remove
// (not a keyed upsert), so we `edit` the existing row or `add` the first one. `persistLocal` (client.ts)
// makes that row durable + cross-tab; nothing here has to know it's persisted — locality is a schema fact.

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import { useStore } from './RindleProvider'
import type { DeckPrefRow } from './localSchema.ts'

const EMPTY: readonly DeckPrefRow[] = []

type SetChatOpen = (next: boolean | ((open: boolean) => boolean)) => void

/** `[chatOpen, setChatOpen]` for a deck, backed by the persisted `deck_pref` local table. Before the
 *  browser store boots (SSR / first paint) the pref reads `false` and the setter no-ops — the panel just
 *  starts closed, then opens on its own if this device left it open. */
export function useDeckChatOpen(deckId: string): [boolean, SetChatOpen] {
  const store = useStore()

  // One live view per (store, deckId): 0 or 1 row, since deck_id is the pk. Torn down on change / unmount.
  const view = useMemo(
    () =>
      store ? store.query.deck_pref.where.deck_id(deckId).materialize() : null,
    [store, deckId],
  )
  useEffect(() => () => view?.destroy(), [view])

  const subscribe = useCallback(
    (onChange: () => void) =>
      view ? view.subscribe(() => onChange()) : () => {},
    [view],
  )
  const getSnapshot = useCallback(
    (): readonly DeckPrefRow[] => (view ? view.data : EMPTY),
    [view],
  )
  const rows = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY)
  const current = rows[0]
  const chatOpen = current?.chat_open ?? false

  const setChatOpen = useCallback<SetChatOpen>(
    (next) => {
      if (!store) return // pre-boot: the toggle isn't reachable before the editor store lands
      const value = typeof next === 'function' ? next(chatOpen) : next
      if (value === chatOpen) return
      void store.writeLocal((tx) => {
        if (current) tx.edit('deck_pref', current, { ...current, chat_open: value })
        else tx.add('deck_pref', { deck_id: deckId, chat_open: value })
      })
    },
    [store, deckId, current, chatOpen],
  )

  return [chatOpen, setChatOpen]
}
