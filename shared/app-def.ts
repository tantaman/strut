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
  text_component,
  image_component,
  shape_component,
  video_component,
  webframe_component,
  custom_background,
  deck_share,
  user_profile,
} from './schema.ts'

export {
  schema,
  deck,
  slide,
  text_component,
  image_component,
  shape_component,
  video_component,
  webframe_component,
  custom_background,
  deck_share,
  user_profile,
}

export const q = newQueryBuilder(schema)

export const rels = defineRelationships({
  deckSlides: rel(deck, slide, { id: 'deck_id' }),
  deckCustomBackgrounds: rel(deck, custom_background, { id: 'deck_id' }),
  deckShares: rel(deck, deck_share, { id: 'deck_id' }),
  slideTexts: rel(slide, text_component, { id: 'slide_id' }),
  slideImages: rel(slide, image_component, { id: 'slide_id' }),
  slideShapes: rel(slide, shape_component, { id: 'slide_id' }),
  slideVideos: rel(slide, video_component, { id: 'slide_id' }),
  slideWebframes: rel(slide, webframe_component, { id: 'slide_id' }),
  // Reverse (child → parent) relationships used by server-only `existsNoSync` permission gates:
  // a slide/component is visible only if its owning deck is owned-by or shared-with the principal.
  slideDeck: rel(slide, deck, { deck_id: 'id' }),
  textDeckSlide: rel(text_component, slide, { slide_id: 'id' }),
  imageDeckSlide: rel(image_component, slide, { slide_id: 'id' }),
  shapeDeckSlide: rel(shape_component, slide, { slide_id: 'id' }),
  videoDeckSlide: rel(video_component, slide, { slide_id: 'id' }),
  webframeDeckSlide: rel(webframe_component, slide, { slide_id: 'id' }),
  customBgDeck: rel(custom_background, deck, { deck_id: 'id' }),
  shareDeck: rel(deck_share, deck, { deck_id: 'id' }),
})

// The five component tables that share the spatial base. Server raw-SQL mutators whitelist against
// this set so a `table` arg can never inject SQL.
export const COMPONENT_TABLES = [
  'text_component',
  'image_component',
  'shape_component',
  'video_component',
  'webframe_component',
] as const
export type ComponentTable = (typeof COMPONENT_TABLES)[number]

export function isComponentTable(t: string): t is ComponentTable {
  return (COMPONENT_TABLES as readonly string[]).includes(t)
}

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
  textIds: string[]
  imageIds: string[]
  shapeIds: string[]
  videoIds: string[]
  webframeIds: string[]
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
  table: ComponentTable
  id: string
  x: number
  y: number
}
export type TransformComponentArgs = {
  table: ComponentTable
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
  table: ComponentTable
  id: string
  z_order: number
}
export type SetComponentClassesArgs = {
  table: ComponentTable
  id: string
  custom_classes: string
}
export type RemoveComponentArgs = { table: ComponentTable; id: string }
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
    for (const id of a.textIds) tx.delete('text_component', { id })
    for (const id of a.imageIds) tx.delete('image_component', { id })
    for (const id of a.shapeIds) tx.delete('shape_component', { id })
    for (const id of a.videoIds) tx.delete('video_component', { id })
    for (const id of a.webframeIds) tx.delete('webframe_component', { id })
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

  addText: (tx: MutationTx, a: AddTextArgs) =>
    tx.insert('text_component', {
      ...spatialBase(a),
      text: a.text,
      size: a.size,
      color: a.color,
      font_family: a.font_family,
    }),

  addImage: (tx: MutationTx, a: AddImageArgs) =>
    tx.insert('image_component', {
      ...spatialBase(a),
      scale_w: a.scale_w,
      scale_h: a.scale_h,
      src: a.src,
      image_type: a.image_type,
    }),

  addShape: (tx: MutationTx, a: AddShapeArgs) =>
    tx.insert('shape_component', {
      ...spatialBase(a),
      shape: a.shape,
      markup: a.markup,
      fill: a.fill,
    }),

  addVideo: (tx: MutationTx, a: AddVideoArgs) =>
    tx.insert('video_component', {
      ...spatialBase(a),
      src: a.src,
      video_type: a.video_type,
      src_type: a.src_type,
      short_src: a.short_src,
    }),

  addWebframe: (tx: MutationTx, a: AddWebframeArgs) =>
    tx.insert('webframe_component', { ...spatialBase(a), src: a.src }),

  moveComponent: (tx: MutationTx, a: MoveComponentArgs) =>
    tx.update(a.table, { id: a.id, x: a.x, y: a.y }),

  transformComponent: (tx: MutationTx, a: TransformComponentArgs) =>
    tx.update(a.table, {
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
    tx.update(a.table, { id: a.id, z_order: a.z_order }),

  setComponentClasses: (tx: MutationTx, a: SetComponentClassesArgs) =>
    tx.update(a.table, { id: a.id, custom_classes: a.custom_classes }),

  removeComponent: (tx: MutationTx, a: RemoveComponentArgs) =>
    tx.delete(a.table, { id: a.id }),

  setText: (tx: MutationTx, a: SetTextArgs) =>
    tx.update('text_component', {
      id: a.id,
      text: a.text,
      size: a.size,
      color: a.color,
      font_family: a.font_family,
    }),

  setShapeFill: (tx: MutationTx, a: SetShapeFillArgs) =>
    tx.update('shape_component', { id: a.id, fill: a.fill }),

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

  // Profile display name. The client predicts an update (a no-op the first time, before the row
  // exists); the server upserts keyed to the authenticated principal and syncs the row back.
  setDisplayName: (tx: MutationTx, a: SetDisplayNameArgs) =>
    tx.update('user_profile', {
      id: a.id,
      display_name: a.display_name,
      updated: a.now,
    }),
} satisfies ClientRegistry
