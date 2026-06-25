// Co-located named queries — the CLIENT definitions. Each is callable on the client (it stamps its
// subscription identity so `useQuery` syncs) and shares a wire `queryName` with a server twin.
//
// Access control: these client queries are intentionally UN-GATED. The browser's local store only ever
// contains rows the server chose to sync, and what syncs is decided by the SERVER's gated twin
// (server/queries.ts) — which scopes every deck subtree to "owned or shared" via `existsNoSync`
// permission gates. `existsNoSync` is a server-only construct (the client can't evaluate it — it has no
// witness rows), so the client queries must stay un-gated and simply read the already-scoped local
// store. The daemon leases/materializes the server twin, so a client can't widen its scope. (We learned
// this the hard way — a shared gated query returns empty on the client. See RINDLE_NOTES #15.)

import { defineQuery } from '@rindle/client'
import { q, rels } from './app-def.ts'
import { SlideFragment } from './fragments.ts'

function reqString(raw: unknown, field: string): string {
  const v = (raw as Record<string, unknown>)?.[field]
  if (typeof v !== 'string' || v.length === 0) throw new Error(`bad ${field}`)
  return v
}

function reqLimit(raw: unknown, field = 'limit'): number {
  const v = (raw as Record<string, unknown>)?.[field]
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 1000)
    throw new Error(`bad ${field}`)
  return v
}

// Dashboard: the principal's decks (the local store already holds only owned + shared), newest first.
export const decksQuery = defineQuery(
  'decks',
  (raw): { limit: number } => ({ limit: reqLimit(raw) }),
  ({ limit }: { limit: number }) =>
    q.deck
      .orderBy('modified', 'desc')
      .limit(limit)
      .countAs('slideCount', rels.deckSlides),
)

// ONE composed query for a whole deck: the deck row + its slides (sorted) + every component on each
// slide (the SlideFragment fragment) + custom backgrounds — a single subscription that replaces the
// deck + slides + (5 × N component) + customBackgrounds queries. This is the fragment-composition win
// (see shared/fragments.ts). The editor, presenter, export and undo-snapshot all read from this.
export const deckDetailQuery = defineQuery(
  'deckDetail',
  (raw): { deckId: string } => ({ deckId: reqString(raw, 'deckId') }),
  ({ deckId }: { deckId: string }) =>
    q.deck.where
      .id(deckId)
      .sub('slides', rels.deckSlides, (s) =>
        s.orderBy('sort', 'asc').include(SlideFragment),
      )
      .sub('customBackgrounds', rels.deckCustomBackgrounds)
      .one(),
)

// Collaborators on a deck (role = 'editor' | 'viewer').
export const deckSharesQuery = defineQuery(
  'deckShares',
  (raw): { deckId: string } => ({ deckId: reqString(raw, 'deckId') }),
  ({ deckId }: { deckId: string }) => q.deck_share.where.deck_id(deckId),
)

// A user's profile (display name). World-readable to any authenticated principal — names aren't secret.
export const profileQuery = defineQuery(
  'profile',
  (raw): { userId: string } => ({ userId: reqString(raw, 'userId') }),
  ({ userId }: { userId: string }) => q.user_profile.where.id(userId).one(),
)

// ---- public read-only link queries -------------------------------------------------------------
// The composed public twin carries the link `token` in its subscription identity, so the SERVER twin
// (server/queries.ts) can sync a deck the principal doesn't own/share when its visibility is
// 'public-read' and its share_token matches. The client copy stays UN-GATED (it just reads the
// already-scoped local store — see the header note above). The token is required + non-empty so an
// empty share_token on a private deck can never be matched.

// Composed public twin — same shape as deckDetailQuery, but its subscription identity carries the
// link `token` so the SERVER twin can sync a deck the principal doesn't own/share (the token is the
// bearer credential). The client copy stays un-gated (reads the already-scoped local store).
export const publicDeckDetailQuery = defineQuery(
  'publicDeckDetail',
  (raw): { deckId: string; token: string } => ({
    deckId: reqString(raw, 'deckId'),
    token: reqString(raw, 'token'),
  }),
  ({ deckId }: { deckId: string; token: string }) =>
    q.deck.where
      .id(deckId)
      .sub('slides', rels.deckSlides, (s) =>
        s.orderBy('sort', 'asc').include(SlideFragment),
      )
      .sub('customBackgrounds', rels.deckCustomBackgrounds)
      .one(),
)

export const allQueries = [
  decksQuery,
  deckDetailQuery,
  publicDeckDetailQuery,
  deckSharesQuery,
  profileQuery,
]
