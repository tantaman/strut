// SERVER query twins — same wire names as shared/queries.ts, but ACCESS-GATED. These are what the
// daemon materializes (the API server registers these), so they decide what ever syncs to a client.
// Gating uses server-only `existsNoSync` permission gates (witness rows are pruned from the client
// footprint and the client never re-evaluates them — which is why the *client* twins stay un-gated;
// see shared/queries.ts and RINDLE_NOTES #15). The principal comes from the authoritative ApiContext.
//
// A deck is accessible if the principal OWNS it or is a COLLABORATOR (a deck_share row). Slides /
// components / custom backgrounds inherit that by climbing child → deck via existsNoSync.

import { defineQuery, existsNoSync, fieldCondition, or } from '@rindle/client'
import type { Cond } from '@rindle/client'
import type { ApiContext } from '@rindle/api-server'
import { q, rels } from '../shared/app-def.ts'
import { profileQuery } from '../shared/queries.ts'

type User = string
type Ctx = ApiContext<User>

function reqString(raw: unknown, field: string): string {
  const v = (raw as Record<string, unknown>)?.[field]
  if (typeof v !== 'string' || v.length === 0) throw new Error(`bad ${field}`)
  return v
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
// Condition on a COMPONENT row (via its component→slide rel): its slide's deck is accessible.
function componentAccess(compSlideRel: any, user: string): Cond<unknown> {
  return existsNoSync(compSlideRel, (s: any) =>
    s.where(slideAccess(user) as never),
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

const slidesQuery = defineQuery(
  'slides',
  (raw): { deckId: string } => ({ deckId: reqString(raw, 'deckId') }),
  ({ deckId }: { deckId: string }, ctx: Ctx) =>
    q.slide.where
      .deck_id(deckId)
      .where(slideAccess(ctx.user) as never)
      .orderBy('sort', 'asc'),
)

const componentQuery = (name: string, table: any, compSlideRel: any) =>
  defineQuery(
    name,
    (raw): { slideId: string } => ({ slideId: reqString(raw, 'slideId') }),
    ({ slideId }: { slideId: string }, ctx: Ctx) =>
      table.where
        .slide_id(slideId)
        .where(componentAccess(compSlideRel, ctx.user) as never)
        .orderBy('z_order', 'asc'),
  )

const textComponentsQuery = componentQuery(
  'textComponents',
  q.text_component,
  rels.textDeckSlide,
)
const imageComponentsQuery = componentQuery(
  'imageComponents',
  q.image_component,
  rels.imageDeckSlide,
)
const shapeComponentsQuery = componentQuery(
  'shapeComponents',
  q.shape_component,
  rels.shapeDeckSlide,
)
const videoComponentsQuery = componentQuery(
  'videoComponents',
  q.video_component,
  rels.videoDeckSlide,
)
const webframeComponentsQuery = componentQuery(
  'webframeComponents',
  q.webframe_component,
  rels.webframeDeckSlide,
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

// profile is world-readable — reuse the un-gated client definition.
export const serverQueries = [
  decksQuery,
  deckQuery,
  slidesQuery,
  textComponentsQuery,
  imageComponentsQuery,
  shapeComponentsQuery,
  videoComponentsQuery,
  webframeComponentsQuery,
  customBackgroundsQuery,
  deckSharesQuery,
  profileQuery,
]
