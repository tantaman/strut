// SERVER query twins — same wire names as shared/queries.ts, but ACCESS-GATED. These are what the
// daemon materializes (the API server registers these), so they decide what ever syncs to a client.
// Gating uses server-only `existsNoSync` permission gates (witness rows are pruned from the client
// footprint and the client never re-evaluates them — which is why the *client* twins stay un-gated;
// see shared/queries.ts and RINDLE_NOTES #15). The principal comes from the authoritative ApiContext.
//
// A deck is accessible if the principal OWNS it or is a COLLABORATOR (a deck_share row). Slides /
// components / custom backgrounds inherit that by climbing child → deck via existsNoSync.

import {
  and,
  defineQuery,
  existsNoSync,
  fieldCondition,
  or,
} from '@rindle/client'
import type { Cond } from '@rindle/client'
import type { ApiContext } from '@rindle/api-server'
import { q, rels } from '../shared/app-def.ts'
import { SlideFragment } from '../shared/fragments.ts'
import { profileQuery } from '../shared/queries.ts'

type User = string
type Ctx = ApiContext<User>

function reqString(raw: unknown, field: string): string {
  const v = (raw as Record<string, unknown>)?.[field]
  if (typeof v !== 'string' || v.length === 0) throw new Error(`bad ${field}`)
  return v
}

// Condition on a DECK row: it is publicly shared under THIS token. Bearer-credential gate — no
// principal needed. Both clauses must hold, so a private deck (token '') can never be matched.
function publicAccess(token: string): Cond<unknown> {
  return and(
    fieldCondition('visibility', 'public-read') as Cond<unknown>,
    fieldCondition('share_token', token) as Cond<unknown>,
  )
}
// Condition on a SLIDE row: its owning deck is publicly shared under this token.
function publicSlideAccess(token: string): Cond<unknown> {
  return existsNoSync(rels.slideDeck, (d: any) =>
    d.where(publicAccess(token) as never),
  ) as Cond<unknown>
}
function reqLimit(raw: unknown): number {
  const v = (raw as Record<string, unknown>)?.limit
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 1000)
    throw new Error('bad limit')
  return v
}

// Condition on a DECK row: principal owns it OR collaborates on it.
function deckAccess(user: string): Cond<unknown> {
  return or(
    fieldCondition('owner_id', user) as Cond<unknown>,
    existsNoSync(rels.deckShares, (s: any) =>
      s.where.user_id(user),
    ) as Cond<unknown>,
  )
}
// Condition on a SLIDE row: its owning deck is accessible.
function slideAccess(user: string): Cond<unknown> {
  return existsNoSync(rels.slideDeck, (d: any) =>
    d.where(deckAccess(user) as never),
  ) as Cond<unknown>
}

const decksQuery = defineQuery(
  'decks',
  (raw): { limit: number } => ({ limit: reqLimit(raw) }),
  ({ limit }: { limit: number }, ctx: Ctx) =>
    q.deck
      .where(deckAccess(ctx.user) as never)
      .orderBy('modified', 'desc')
      .limit(limit)
      .countAs('slideCount', rels.deckSlides),
)

const deckQuery = defineQuery(
  'deck',
  (raw): { deckId: string } => ({ deckId: reqString(raw, 'deckId') }),
  ({ deckId }: { deckId: string }, ctx: Ctx) =>
    q.deck.where
      .id(deckId)
      .where(deckAccess(ctx.user) as never)
      .one(),
)

// Composed deck subtree (deck + slides + components + custom backgrounds), gated ONCE at the deck
// root: because the whole tree hangs off this deck via correlated `sub` edges, scoping the root to
// "owned or shared" scopes every descendant — no per-table `existsNoSync` climb needed. Same wire
// name + fragment as the client `deckDetail`, so the only difference is this root `where`.
const deckDetailQuery = defineQuery(
  'deckDetail',
  (raw): { deckId: string } => ({ deckId: reqString(raw, 'deckId') }),
  ({ deckId }: { deckId: string }, ctx: Ctx) =>
    q.deck.where
      .id(deckId)
      .where(deckAccess(ctx.user) as never)
      .sub('slides', rels.deckSlides, (s: any) =>
        s.orderBy('sort', 'asc').include(SlideFragment),
      )
      .sub('customBackgrounds', rels.deckCustomBackgrounds)
      .one(),
)

const slidesQuery = defineQuery(
  'slides',
  (raw): { deckId: string } => ({ deckId: reqString(raw, 'deckId') }),
  ({ deckId }: { deckId: string }, ctx: Ctx) =>
    q.slide.where
      .deck_id(deckId)
      .where(slideAccess(ctx.user) as never)
      .orderBy('sort', 'asc'),
)

const customBackgroundsQuery = defineQuery(
  'customBackgrounds',
  (raw): { deckId: string } => ({ deckId: reqString(raw, 'deckId') }),
  ({ deckId }: { deckId: string }, ctx: Ctx) =>
    q.custom_background.where
      .deck_id(deckId)
      .where(
        existsNoSync(rels.customBgDeck, (d: any) =>
          d.where(deckAccess(ctx.user) as never),
        ) as never,
      ),
)

// Collaborators on a deck — visible to the OWNER (manages the list) and to each collaborator (their own row).
const deckSharesQuery = defineQuery(
  'deckShares',
  (raw): { deckId: string } => ({ deckId: reqString(raw, 'deckId') }),
  ({ deckId }: { deckId: string }, ctx: Ctx) =>
    q.deck_share.where
      .deck_id(deckId)
      .where(
        or(
          fieldCondition('user_id', ctx.user) as Cond<unknown>,
          existsNoSync(rels.shareDeck, (d: any) =>
            d.where.owner_id(ctx.user),
          ) as Cond<unknown>,
        ) as never,
      ),
)

// ---- public read-only link twins ---------------------------------------------------------------
// Same wire names as the client public queries, gated purely on the bearer token (publicAccess) so a
// stranger with the link syncs the deck subtree even though they don't own/collaborate on it.

const publicDeckQuery = defineQuery(
  'publicDeck',
  (raw): { deckId: string; token: string } => ({
    deckId: reqString(raw, 'deckId'),
    token: reqString(raw, 'token'),
  }),
  ({ deckId, token }: { deckId: string; token: string }) =>
    q.deck.where
      .id(deckId)
      .where(publicAccess(token) as never)
      .one(),
)

const publicSlidesQuery = defineQuery(
  'publicSlides',
  (raw): { deckId: string; token: string } => ({
    deckId: reqString(raw, 'deckId'),
    token: reqString(raw, 'token'),
  }),
  ({ deckId, token }: { deckId: string; token: string }) =>
    q.slide.where
      .deck_id(deckId)
      .where(publicSlideAccess(token) as never)
      .orderBy('sort', 'asc'),
)

// Composed public twin — gated purely on the bearer token at the deck root (publicAccess), which
// scopes the whole correlated subtree. Mirrors deckDetailQuery for the share viewer / SSR.
const publicDeckDetailQuery = defineQuery(
  'publicDeckDetail',
  (raw): { deckId: string; token: string } => ({
    deckId: reqString(raw, 'deckId'),
    token: reqString(raw, 'token'),
  }),
  ({ deckId, token }: { deckId: string; token: string }) =>
    q.deck.where
      .id(deckId)
      .where(publicAccess(token) as never)
      .sub('slides', rels.deckSlides, (s: any) =>
        s.orderBy('sort', 'asc').include(SlideFragment),
      )
      .sub('customBackgrounds', rels.deckCustomBackgrounds)
      .one(),
)

const publicCustomBackgroundsQuery = defineQuery(
  'publicCustomBackgrounds',
  (raw): { deckId: string; token: string } => ({
    deckId: reqString(raw, 'deckId'),
    token: reqString(raw, 'token'),
  }),
  ({ deckId, token }: { deckId: string; token: string }) =>
    q.custom_background.where
      .deck_id(deckId)
      .where(
        existsNoSync(rels.customBgDeck, (d: any) =>
          d.where(publicAccess(token) as never),
        ) as never,
      ),
)

// profile is world-readable — reuse the un-gated client definition.
export const serverQueries = [
  decksQuery,
  deckQuery,
  slidesQuery,
  deckDetailQuery,
  publicDeckDetailQuery,
  customBackgroundsQuery,
  deckSharesQuery,
  profileQuery,
  publicDeckQuery,
  publicSlidesQuery,
  publicCustomBackgroundsQuery,
]
