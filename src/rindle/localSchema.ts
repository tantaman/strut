// The client-only Rindle schema extension: two local-only tables the browser engine adds on top of the
// synced `schema`. Neither ever syncs (invisible to co-editors), both are written with `store.writeLocal`
// (NOT `app.mutate.*` — a replayable shared mutator may not touch a local table) and read with
// `store.query.*` (a named/remote query may not reference a local table by design). Only the BROWSER
// client learns them (see client.ts `clientSchema`); SSR / the server keep the plain synced `schema`.
//
// The two variants of `local` differ ONLY in durability (client.ts enables `persistLocal`, so the split
// is now live):
//   • `local: true`     → DURABLE + cross-tab: persisted per (origin, user) in IndexedDB and kept
//                         coherent across this device's tabs. Use it for device preferences that should
//                         survive a reload. → `deck_pref`.
//   • `local: "session"` → EPHEMERAL, per-tab: never persisted, never replicated across tabs, gone on
//                         reload — even with `persistLocal` on. Use it for scratch state. → `chat_message`.

import { boolean, extendSchema, number, string, table } from '@rindle/client'
import { schema } from '../../shared/app-def.ts'

// Per-deck editor preferences for THIS device, persisted across reloads (`local: true`). Keyed by deck,
// so reopening a deck restores how you left it — currently just whether the ✨ Chat panel was open.
// Never synced: it's a device preference, not deck content (no cross-store FK to `deck` — a plain string).
export const deckPref = table('deck_pref', { local: true })
  .columns({
    deck_id: string(),
    chat_open: boolean(), // was the ✨ Chat panel open when you last left this deck?
  })
  .primaryKey('deck_id')

/** A `deck_pref` row (all columns), for the `store.writeLocal` upsert (`tx.edit` wants the full prior row). */
export interface DeckPrefRow {
  deck_id: string
  chat_open: boolean
}

// The "✨ Chat" advisor thread. EPHEMERAL by choice (`local: "session"`): an advisor bounce doesn't need
// durable history, and it must NOT follow the user across tabs — so it stays outside the persistence plane
// even though `persistLocal` is on. Written with `store.writeLocal`, read with `store.query.chat_message`.
export const chatMessage = table('chat_message', { local: 'session' })
  .columns({
    id: string(),
    deck_id: string(), // scopes the thread to a deck (a plain string — no cross-store FK to `deck`)
    role: string<'user' | 'assistant'>(),
    content: string(), // grows per token for a streaming assistant turn
    status: string<'streaming' | 'done' | 'error'>(), // drives the typing caret / error styling
    note: string(), // transient sub-status shown below the content while applying a chat action
    created: number(), // thread order within a deck
  })
  .primaryKey('id')

/** A `chat_message` row (all columns), for the streaming write path (`tx.edit` wants the full prior row —
 *  RINDLE_NOTES #21). */
export interface ChatMessageRow {
  id: string
  deck_id: string
  role: 'user' | 'assistant'
  content: string
  status: 'streaming' | 'done' | 'error'
  note: string
  created: number
}

// extendSchema deliberately accepts ONLY local tables (`local: true` / `"session"`) — synced tables stay
// server-generated (`rindle schema gen`) so client and server can't drift. The browser client is built
// with this combined schema; everything downstream (`store.query.*`, `store.writeLocal`) then resolves typed.
export const clientSchema = extendSchema(schema, {
  tables: [deckPref, chatMessage],
})
