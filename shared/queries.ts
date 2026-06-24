// Co-located named queries. Each is callable on the client (it stamps its subscription identity so
// `useQuery` syncs) and registerable on the server via `registerQueries([...])`. The `validate` step
// runs on BOTH tiers to build a byte-identical AST from untrusted args.

import { defineQuery } from '@rindle/client'
import { q, rels } from './app-def.ts'

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

// Authoritative principal injected by the API server (via registerQueries' ApiContext) on the server
// tier, and passed explicitly by the client. The wire NEVER carries it, so a client can't widen its
// own scope by lying — the daemon materializes the server-resolved (trusted) query. See RINDLE_NOTES.
export type QueryCtx = { user: string }

// Dashboard: the current user's most-recently-modified decks, with a live slide count badge.
// Scoped by owner_id = ctx.user (Phase 1 ownership). Shared-with-me decks come later (Phase 3).
export const decksQuery = defineQuery(
  'decks',
  (raw): { limit: number } => ({ limit: reqLimit(raw) }),
  ({ limit }: { limit: number }, ctx: QueryCtx) =>
    q.deck.where
      .owner_id(ctx.user)
      .orderBy('modified', 'desc')
      .limit(limit)
      .countAs('slideCount', rels.deckSlides),
)

// A single deck (its settings/theme).
export const deckQuery = defineQuery(
  'deck',
  (raw): { deckId: string } => ({ deckId: reqString(raw, 'deckId') }),
  ({ deckId }: { deckId: string }) => q.deck.where.id(deckId).one(),
)

// All slides of a deck in camera-path order.
export const slidesQuery = defineQuery(
  'slides',
  (raw): { deckId: string } => ({ deckId: reqString(raw, 'deckId') }),
  ({ deckId }: { deckId: string }) =>
    q.slide.where.deck_id(deckId).orderBy('sort', 'asc'),
)

// Components of one slide, per type, in z-order.
export const textComponentsQuery = defineQuery(
  'textComponents',
  (raw): { slideId: string } => ({ slideId: reqString(raw, 'slideId') }),
  ({ slideId }: { slideId: string }) =>
    q.text_component.where.slide_id(slideId).orderBy('z_order', 'asc'),
)

export const imageComponentsQuery = defineQuery(
  'imageComponents',
  (raw): { slideId: string } => ({ slideId: reqString(raw, 'slideId') }),
  ({ slideId }: { slideId: string }) =>
    q.image_component.where.slide_id(slideId).orderBy('z_order', 'asc'),
)

export const shapeComponentsQuery = defineQuery(
  'shapeComponents',
  (raw): { slideId: string } => ({ slideId: reqString(raw, 'slideId') }),
  ({ slideId }: { slideId: string }) =>
    q.shape_component.where.slide_id(slideId).orderBy('z_order', 'asc'),
)

export const videoComponentsQuery = defineQuery(
  'videoComponents',
  (raw): { slideId: string } => ({ slideId: reqString(raw, 'slideId') }),
  ({ slideId }: { slideId: string }) =>
    q.video_component.where.slide_id(slideId).orderBy('z_order', 'asc'),
)

export const webframeComponentsQuery = defineQuery(
  'webframeComponents',
  (raw): { slideId: string } => ({ slideId: reqString(raw, 'slideId') }),
  ({ slideId }: { slideId: string }) =>
    q.webframe_component.where.slide_id(slideId).orderBy('z_order', 'asc'),
)

export const customBackgroundsQuery = defineQuery(
  'customBackgrounds',
  (raw): { deckId: string } => ({ deckId: reqString(raw, 'deckId') }),
  ({ deckId }: { deckId: string }) => q.custom_background.where.deck_id(deckId),
)

export const allQueries = [
  decksQuery,
  deckQuery,
  slidesQuery,
  textComponentsQuery,
  imageComponentsQuery,
  shapeComponentsQuery,
  videoComponentsQuery,
  webframeComponentsQuery,
  customBackgroundsQuery,
]
