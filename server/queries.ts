// SERVER query twins — same wire names as shared/queries.ts, but ACCESS-GATED. These are what the
// daemon materializes (the API server registers these), so they decide what ever syncs to a client.
// Gating uses server-only `existsNoSync` permission gates (witness rows are pruned from the client
// footprint and the client never re-evaluates them — which is why the *client* twins stay un-gated;
// see shared/queries.ts and RINDLE_NOTES #15). The principal comes from the authoritative ApiContext.
//
// A deck is accessible if the principal OWNS it or is a COLLABORATOR (a deck_share row). The composed
// deckDetail subtree (slides / components / custom backgrounds) inherits that by gating ONCE at its
// deck root — the correlated `sub` edges scope every descendant, so no per-child existsNoSync climb
// is needed.

import { and, defineQuery, existsNoSync, or } from '@rindle/client'
import type { ApiContext } from '@rindle/api-server'
import { q, rels, deck, deck_share } from '../shared/app-def.ts'
import { deckDetailBody, profileQuery } from '../shared/queries.ts'

type User = string
type Ctx = ApiContext<User>

function reqString(raw: unknown, field: string): string {
  const v = (raw as Record<string, unknown>)?.[field]
  if (typeof v !== 'string' || v.length === 0) throw new Error(`bad ${field}`)
  return v
}

// Condition on a DECK row: it is publicly shared under THIS token. Bearer-credential gate — no
// principal needed. Both clauses must hold, so a private deck (token '') can never be matched.
function publicAccess(token: string) {
  return and(deck.visibility('public-read'), deck.share_token(token))
}
function reqLimit(raw: unknown): number {
  const v = (raw as Record<string, unknown>)?.limit
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 1000)
    throw new Error('bad limit')
  return v
}

// Condition on a DECK row: principal owns it OR collaborates on it.
function deckAccess(user: string) {
  return or(
    deck.owner_id(user),
    existsNoSync(rels.deckShares, (s) => s.where.user_id(user)),
  )
}
const decksQuery = defineQuery(
  'decks',
  (raw): { limit: number } => ({ limit: reqLimit(raw) }),
  ({ limit }: { limit: number }, ctx: Ctx) =>
    q.deck
      .where(deckAccess(ctx.user))
      .orderBy('modified', 'desc')
      .limit(limit)
      .countAs('slideCount', rels.deckSlides),
)

// Composed deck subtree (deck + slides + components + custom backgrounds), gated ONCE at the deck
// root: because the whole tree hangs off this deck via correlated `sub` edges, scoping the root to
// "owned or shared" scopes every descendant — no per-table `existsNoSync` climb needed. The subtree
// shape itself is the shared `deckDetailBody`; the only thing this twin adds is the root `where` gate.
const deckDetailQuery = defineQuery(
  'deckDetail',
  (raw): { deckId: string } => ({ deckId: reqString(raw, 'deckId') }),
  ({ deckId }: { deckId: string }, ctx: Ctx) =>
    deckDetailBody(q.deck.where.id(deckId).where(deckAccess(ctx.user))),
)

// Collaborators on a deck — visible to the OWNER (manages the list) and to each collaborator (their own row).
const deckSharesQuery = defineQuery(
  'deckShares',
  (raw): { deckId: string } => ({ deckId: reqString(raw, 'deckId') }),
  ({ deckId }: { deckId: string }, ctx: Ctx) =>
    q.deck_share.where.deck_id(deckId).where(
      or(
        deck_share.user_id(ctx.user),
        existsNoSync(rels.shareDeck, (d) => d.where.owner_id(ctx.user)),
      ),
    ),
)

// ---- public read-only link twins ---------------------------------------------------------------
// Same wire names as the client public queries, gated purely on the bearer token (publicAccess) so a
// stranger with the link syncs the deck subtree even though they don't own/collaborate on it.

// Composed public twin — gated purely on the bearer token at the deck root (publicAccess), which
// scopes the whole correlated subtree. Mirrors deckDetailQuery for the share viewer / SSR.
const publicDeckDetailQuery = defineQuery(
  'publicDeckDetail',
  (raw): { deckId: string; token: string } => ({
    deckId: reqString(raw, 'deckId'),
    token: reqString(raw, 'token'),
  }),
  ({ deckId, token }: { deckId: string; token: string }) =>
    deckDetailBody(q.deck.where.id(deckId).where(publicAccess(token))),
)

// Research notes for a deck — gated by access to the note's OWNING deck (existsNoSync via noteDeck), so
// notes sync only for decks the principal owns or collaborates on. Separate from deckDetail on purpose:
// the (potentially large) note docs load on demand when the Research surface subscribes.
const deckNotesQuery = defineQuery(
  'deckNotes',
  (raw): { deckId: string } => ({ deckId: reqString(raw, 'deckId') }),
  ({ deckId }: { deckId: string }, ctx: Ctx) =>
    q.slide_notes.where
      .deck_id(deckId)
      .where(existsNoSync(rels.noteDeck, (d) => d.where(deckAccess(ctx.user)))),
)

// profile is world-readable — reuse the un-gated client definition.
export const serverQueries = [
  decksQuery,
  deckDetailQuery,
  publicDeckDetailQuery,
  deckSharesQuery,
  deckNotesQuery,
  profileQuery,
]
