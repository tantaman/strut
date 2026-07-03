// Shared contract imported by BOTH the browser client and the API server.
// - `q` / `rels`: the query builder + relationships used to build named queries.
// - arg types: written once, flow to client mutators, server mutators, and the UI call sites.
// - `mutators`: the PREDICTED (optimistic) client mutators. The API server holds authoritative
//   twins by the same name (server/rindle-api.ts).
//
// Rule (Rindle): predicted mutators must be deterministic + replayable — no Date.now(), no random,
// no I/O. Pass ids and timestamps in as args.

import { defineRelationships, newQueryBuilder, rel } from '@rindle/client'
import type { WireValue } from '@rindle/client'
import type { ClientRegistry, MutationTx } from '@rindle/optimistic'
import {
  schema,
  deck,
  slide,
  component,
  custom_background,
  deck_share,
  user_profile,
} from './schema.ts'
import { serializeProps } from './componentProps.ts'

export {
  schema,
  deck,
  slide,
  component,
  custom_background,
  deck_share,
  user_profile,
}
export type { ComponentType } from './componentProps.ts'

export const q = newQueryBuilder(schema)

export const rels = defineRelationships({
  deckSlides: rel(deck, slide, { id: 'deck_id' }),
  deckCustomBackgrounds: rel(deck, custom_background, { id: 'deck_id' }),
  deckShares: rel(deck, deck_share, { id: 'deck_id' }),
  slideComponents: rel(slide, component, { id: 'slide_id' }),
  // Reverse (child → parent) relationships used by server-only `existsNoSync` permission gates:
  // a slide/component is visible only if its owning deck is owned-by or shared-with the principal.
  slideDeck: rel(slide, deck, { deck_id: 'id' }),
  componentSlide: rel(component, slide, { slide_id: 'id' }),
  customBgDeck: rel(custom_background, deck, { deck_id: 'id' }),
  shareDeck: rel(deck_share, deck, { deck_id: 'id' }),
})

// ---- argument types (the single source of shape for both tiers + the UI) -------------------------

export type CreateDeckArgs = {
  id: string
  title: string
  ownerId: string
  now: number
}
export type RenameDeckArgs = { id: string; title: string; now: number }
export type TouchDeckArgs = { id: string; now: number }
export type DeleteDeckArgs = { id: string }
export type SetDeckThemeArgs = {
  id: string
  background?: string
  surface?: string
  custom_stylesheet?: string
  chosen_presenter?: string
  canned_transition?: string
  now: number
}

export type AddSlideArgs = {
  id: string
  deckId: string
  sort: string
  x: number
  y: number
  now: number
}
export type DeleteSlideArgs = {
  id: string
  componentIds: string[]
}
export type ReorderSlideArgs = { id: string; sort: string }
export type SetSlideTransformArgs = {
  id: string
  x: number
  y: number
  z: number
  rotate_x: number
  rotate_y: number
  rotate_z: number
  imp_scale: number
  now: number
}
export type SetSlideThemeArgs = {
  id: string
  background?: string
  surface?: string
  now: number
}

type SpatialArgs = {
  id: string
  slideId: string
  x: number
  y: number
  z_order: number
}
export type AddTextArgs = SpatialArgs & {
  text: string
  size: number
  color: string
  font_family: string
}
export type AddImageArgs = SpatialArgs & {
  src: string
  image_type: string
  scale_w: number
  scale_h: number
}
export type AddShapeArgs = SpatialArgs & {
  shape: string
  markup: string
  fill: string
}
export type AddVideoArgs = SpatialArgs & {
  src: string
  video_type: string
  src_type: string
  short_src: string
}
export type AddWebframeArgs = SpatialArgs & { src: string }

export type MoveComponentArgs = {
  id: string
  x: number
  y: number
}
export type TransformComponentArgs = {
  id: string
  scale_x: number
  scale_y: number
  scale_w: number
  scale_h: number
  rotate: number
  skew_x: number
  skew_y: number
}
export type SetComponentZArgs = {
  id: string
  z_order: number
}
export type SetComponentClassesArgs = {
  id: string
  custom_classes: string
}
export type RemoveComponentArgs = { id: string }
export type SetTextArgs = {
  id: string
  text: string
  size: number
  color: string
  font_family: string
}
export type SetShapeFillArgs = { id: string; fill: string }
export type MintCustomColorArgs = {
  id: string
  deckId: string
  klass: string
  style: string
}

// ---- sharing + profile -------------------------------------------------------------------------
export type CollaboratorRole = 'editor' | 'viewer'
// id = the deck_share row id; userId = the collaborator's Strut id; role = editor|viewer.
export type AddCollaboratorArgs = {
  id: string
  deckId: string
  userId: string
  role: CollaboratorRole
  now: number
}
export type RemoveCollaboratorArgs = { id: string }
// Public read-only link. visibility = 'private' | 'public-read'; share_token is the link secret
// (a fresh random token when turning sharing on, '' when turning it off). Owner-only (server-gated).
export type SetDeckVisibilityArgs = {
  id: string
  visibility: string
  share_token: string
  now: number
}
// id = the profile's user id (the server overrides it with the authenticated principal).
export type SetDisplayNameArgs = {
  id: string
  display_name: string
  now: number
}

// ---- predicted (optimistic) client mutators -----------------------------------------------------

const spatialBase = (a: SpatialArgs) => ({
  id: a.id,
  slide_id: a.slideId,
  z_order: a.z_order,
  x: a.x,
  y: a.y,
  scale_x: 1,
  scale_y: 1,
  scale_w: 0,
  scale_h: 0,
  rotate: 0,
  skew_x: 0,
  skew_y: 0,
  custom_classes: '',
})

export const mutators = {
  createDeck: (tx: MutationTx, a: CreateDeckArgs) =>
    tx.insert('deck', {
      id: a.id,
      title: a.title,
      created: a.now,
      modified: a.now,
      background: 'bg-default',
      surface: 'bg-default',
      chosen_presenter: 'impress',
      canned_transition: 'none',
      custom_stylesheet: '',
      deck_version: '1.0',
      // The server overrides owner_id with the authenticated principal (can't be spoofed); the client
      // predicts it so the optimistic row passes the owner-scoped decksQuery filter immediately.
      owner_id: a.ownerId,
      visibility: 'private',
      share_token: '',
    }),

  renameDeck: (tx: MutationTx, a: RenameDeckArgs) =>
    tx.update('deck', { id: a.id, title: a.title, modified: a.now }),

  touchDeck: (tx: MutationTx, a: TouchDeckArgs) =>
    tx.update('deck', { id: a.id, modified: a.now }),

  // Client predicts the deck row removal; the server twin cascades slides + components, and those
  // deletions arrive via sync. (Rindle has no FK cascade / no "delete where" in a predicted tx.)
  deleteDeck: (tx: MutationTx, a: DeleteDeckArgs) =>
    tx.delete('deck', { id: a.id }),

  setDeckTheme: (tx: MutationTx, a: SetDeckThemeArgs) => {
    const row: Record<string, WireValue> = { id: a.id, modified: a.now }
    if (a.background !== undefined) row.background = a.background
    if (a.surface !== undefined) row.surface = a.surface
    if (a.custom_stylesheet !== undefined)
      row.custom_stylesheet = a.custom_stylesheet
    if (a.chosen_presenter !== undefined)
      row.chosen_presenter = a.chosen_presenter
    if (a.canned_transition !== undefined)
      row.canned_transition = a.canned_transition
    tx.update('deck', row)
  },

  addSlide: (tx: MutationTx, a: AddSlideArgs) =>
    tx.insert('slide', {
      id: a.id,
      deck_id: a.deckId,
      sort: a.sort,
      x: a.x,
      y: a.y,
      z: 0,
      rotate_x: 0,
      rotate_y: 0,
      rotate_z: 0,
      imp_scale: 3,
      background: '',
      surface: '',
      created: a.now,
      modified: a.now,
    }),

  deleteSlide: (tx: MutationTx, a: DeleteSlideArgs) => {
    for (const id of a.componentIds) tx.delete('component', { id })
    tx.delete('slide', { id: a.id })
  },

  reorderSlide: (tx: MutationTx, a: ReorderSlideArgs) =>
    tx.update('slide', { id: a.id, sort: a.sort }),

  setSlideTransform: (tx: MutationTx, a: SetSlideTransformArgs) =>
    tx.update('slide', {
      id: a.id,
      x: a.x,
      y: a.y,
      z: a.z,
      rotate_x: a.rotate_x,
      rotate_y: a.rotate_y,
      rotate_z: a.rotate_z,
      imp_scale: a.imp_scale,
      modified: a.now,
    }),

  setSlideTheme: (tx: MutationTx, a: SetSlideThemeArgs) => {
    const row: Record<string, WireValue> = { id: a.id, modified: a.now }
    if (a.background !== undefined) row.background = a.background
    if (a.surface !== undefined) row.surface = a.surface
    tx.update('slide', row)
  },

  // One `component` table now (see shared/schema.ts). Each insert stamps `type`, the shared spatial
  // base + `fill` column, and the type-specific `props` JSON (serializeProps keeps client + server
  // byte-identical). `fill` is only meaningful for shapes; '' elsewhere.
  addText: (tx: MutationTx, a: AddTextArgs) =>
    tx.insert('component', {
      ...spatialBase(a),
      type: 'text',
      fill: '',
      props: serializeProps('text', a),
    }),

  addImage: (tx: MutationTx, a: AddImageArgs) =>
    tx.insert('component', {
      ...spatialBase(a),
      scale_w: a.scale_w,
      scale_h: a.scale_h,
      type: 'image',
      fill: '',
      props: serializeProps('image', a),
    }),

  addShape: (tx: MutationTx, a: AddShapeArgs) =>
    tx.insert('component', {
      ...spatialBase(a),
      type: 'shape',
      fill: a.fill,
      props: serializeProps('shape', a),
    }),

  addVideo: (tx: MutationTx, a: AddVideoArgs) =>
    tx.insert('component', {
      ...spatialBase(a),
      type: 'video',
      fill: '',
      props: serializeProps('video', a),
    }),

  addWebframe: (tx: MutationTx, a: AddWebframeArgs) =>
    tx.insert('component', {
      ...spatialBase(a),
      type: 'webframe',
      fill: '',
      props: serializeProps('webframe', a),
    }),

  moveComponent: (tx: MutationTx, a: MoveComponentArgs) =>
    tx.update('component', { id: a.id, x: a.x, y: a.y }),

  transformComponent: (tx: MutationTx, a: TransformComponentArgs) =>
    tx.update('component', {
      id: a.id,
      scale_x: a.scale_x,
      scale_y: a.scale_y,
      scale_w: a.scale_w,
      scale_h: a.scale_h,
      rotate: a.rotate,
      skew_x: a.skew_x,
      skew_y: a.skew_y,
    }),

  setComponentZ: (tx: MutationTx, a: SetComponentZArgs) =>
    tx.update('component', { id: a.id, z_order: a.z_order }),

  setComponentClasses: (tx: MutationTx, a: SetComponentClassesArgs) =>
    tx.update('component', { id: a.id, custom_classes: a.custom_classes }),

  removeComponent: (tx: MutationTx, a: RemoveComponentArgs) =>
    tx.delete('component', { id: a.id }),

  // Rewrites the whole text `props` blob (it carries all four text fields, so no partial-merge needed).
  setText: (tx: MutationTx, a: SetTextArgs) =>
    tx.update('component', { id: a.id, props: serializeProps('text', a) }),

  // `fill` is a column, so this is a plain per-column patch (the optimistic client can't merge into
  // an opaque props blob) — concurrent fill vs. any other edit both survive.
  setShapeFill: (tx: MutationTx, a: SetShapeFillArgs) =>
    tx.update('component', { id: a.id, fill: a.fill }),

  mintCustomColor: (tx: MutationTx, a: MintCustomColorArgs) =>
    tx.insert('custom_background', {
      id: a.id,
      deck_id: a.deckId,
      klass: a.klass,
      style: a.style,
    }),

  // Sharing: the server twins enforce that only the deck OWNER may add/remove collaborators (a
  // conditional write — the optimistic insert/delete snaps back if the actor isn't the owner).
  addCollaborator: (tx: MutationTx, a: AddCollaboratorArgs) =>
    tx.insert('deck_share', {
      id: a.id,
      deck_id: a.deckId,
      user_id: a.userId,
      role: a.role,
      created: a.now,
    }),

  removeCollaborator: (tx: MutationTx, a: RemoveCollaboratorArgs) =>
    tx.delete('deck_share', { id: a.id }),

  // Public link: flip visibility + (re)mint or clear the share token. The server twin gates this on
  // deck ownership, so a non-owner's optimistic update snaps back.
  setDeckVisibility: (tx: MutationTx, a: SetDeckVisibilityArgs) =>
    tx.update('deck', {
      id: a.id,
      visibility: a.visibility,
      share_token: a.share_token,
      modified: a.now,
    }),

  // Profile display name. The client predicts an update (a no-op the first time, before the row
  // exists); the server upserts keyed to the authenticated principal and syncs the row back.
  setDisplayName: (tx: MutationTx, a: SetDisplayNameArgs) =>
    tx.update('user_profile', {
      id: a.id,
      display_name: a.display_name,
      updated: a.now,
    }),
} satisfies ClientRegistry
