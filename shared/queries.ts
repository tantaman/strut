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

export const deckQuery = defineQuery(
  'deck',
  (raw): { deckId: string } => ({ deckId: reqString(raw, 'deckId') }),
  ({ deckId }: { deckId: string }) => q.deck.where.id(deckId).one(),
)

export const slidesQuery = defineQuery(
  'slides',
  (raw): { deckId: string } => ({ deckId: reqString(raw, 'deckId') }),
  ({ deckId }: { deckId: string }) =>
    q.slide.where.deck_id(deckId).orderBy('sort', 'asc'),
)

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
  deckSharesQuery,
  profileQuery,
]
