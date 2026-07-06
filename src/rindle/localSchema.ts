// The client-only Rindle schema extension: a memory-only `chat_message` table for the "✨ Chat" advisor
// panel (AI_CHAT_PLAN.md). This is the canonical local-table use case — private, per-device scratch text
// that never syncs.
//
// `{ local: true }` makes the table client-authoritative and memory-only: it NEVER syncs (invisible to
// co-editors), is written with `store.writeLocal` (NOT `app.mutate.*` — a replayable shared mutator may
// not touch a local table), read with `store.query.chat_message` (a named/remote query may not reference a
// local table by design), and is gone on reload. That's deliberate: an advisor bounce doesn't need durable
// history. Only the BROWSER client learns this table (see client.ts `clientSchema`); SSR / the server keep
// the plain synced `schema`, which is correct — the table simply doesn't exist server-side.

import { extendSchema, number, string, table } from '@rindle/client'
import { schema } from '../../shared/app-def.ts'

export const chatMessage = table('chat_message', { local: true })
  .columns({
    id: string(),
    deck_id: string(), // scopes the thread to a deck (a plain string — no cross-store FK to `deck`)
    role: string<'user' | 'assistant'>(),
    content: string(), // grows per token for a streaming assistant turn
    status: string<'streaming' | 'done' | 'error'>(), // drives the typing caret / error styling
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
  created: number
}

// extendSchema deliberately accepts ONLY { local: true } tables — synced tables stay server-generated
// (`rindle schema gen`) so client and server can't drift. The browser client is built with this combined
// schema; everything downstream (`store.query.chat_message`, `store.writeLocal`) then resolves typed.
export const clientSchema = extendSchema(schema, { tables: [chatMessage] })
