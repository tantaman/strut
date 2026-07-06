// Shared contract imported by BOTH the browser client and the API server.
// - refined `schema` / tables: the generated schema.ts narrowed within-kind (json<ComponentProps>()
//   on component.props, literal unions on type/visibility/role/render_mode) — refineTable/refineSchema.
// - `q` / `rels`: the query builder + relationships used to build named queries.
// - arg schemas (zod): written once; the SERVER parses untrusted wire args through them, and BOTH
//   tiers derive the arg TYPE via z.infer.
// - `mutators`: ISOMORPHIC — one generator body per mutator, run on BOTH tiers (the browser drives it
//   synchronously as the optimistic prediction; the server drives the SAME body asynchronously against
//   a live daemon txn, rendering each yielded op to SQL). server/rindle-api.ts adds only the authority
//   the client must NOT predict (row-level access guards) as overrides.
//
// Rule (Rindle): a shared mutator body must be deterministic + replayable — no Date.now(), no random,
// no I/O — because the client RE-INVOKES it on every rebase. Pass ids and timestamps in as args. The
// acting principal is ctx.user (never a client-supplied arg), injected per-tier.

import {
  defineRelationships,
  json,
  newQueryBuilder,
  refineSchema,
  refineTable,
  rel,
  shared,
  string,
} from '@rindle/client'
import type {
  IsoTx,
  KeyedRow,
  MutationGen,
  MutatorCtx,
  Row,
} from '@rindle/client'
import type { ClientRegistry } from '@rindle/optimistic'
import { z } from 'zod'
import {
  component as componentGen,
  custom_background,
  deck as deckGen,
  deck_share as deckShareGen,
  schema as schemaGen,
  slide as slideGen,
  user_profile,
} from './schema.ts'
import { componentProps } from './componentProps.ts'
import type { ComponentProps, ComponentType } from './componentProps.ts'

export type { ComponentType } from './componentProps.ts'

// ---- literal unions the SQL can't carry (refined once here; survive every schema regen) -----------
export type CollaboratorRole = 'editor' | 'viewer'
export type Visibility = 'private' | 'public-read'
// render_mode / default_slide_mode: '' = spatial (components) | 'markdown' = full-slide markdown.
export type SlideMode = '' | 'markdown'

// refineTable re-types the generated columns within their kind (runtime-validated identity — the wire
// shape is unchanged). props becomes the typed JSON object; the discriminator + enums become unions.
export const component = refineTable(componentGen, {
  type: string<ComponentType>(),
  props: json<ComponentProps>(),
})
export const deck = refineTable(deckGen, {
  visibility: string<Visibility>(),
  default_slide_mode: string<SlideMode>(),
})
export const deck_share = refineTable(deckShareGen, {
  role: string<CollaboratorRole>(),
})
// slide.render_mode narrowed to SlideMode; text_align stays a bare string (open value set).
export const slide = refineTable(slideGen, { render_mode: string<SlideMode>() })

export const schema = refineSchema(schemaGen, {
  tables: [component, deck, deck_share, slide],
})
export { custom_background, user_profile }

export const q = newQueryBuilder(schema)

export const rels = defineRelationships({
  deckSlides: rel(deck, slide, { id: 'deck_id' }),
  deckCustomBackgrounds: rel(deck, custom_background, { id: 'deck_id' }),
  deckShares: rel(deck, deck_share, { id: 'deck_id' }),
  slideComponents: rel(slide, component, { id: 'slide_id' }),
  // Reverse (child → parent) relationships used by server-only `existsNoSync` permission gates and by
  // the server mutator access guards (server/rindle-api.ts): a slide/component is editable only if its
  // owning deck is owned-by or editor-shared-with the principal.
  slideDeck: rel(slide, deck, { deck_id: 'id' }),
  componentSlide: rel(component, slide, { slide_id: 'id' }),
  customBgDeck: rel(custom_background, deck, { deck_id: 'id' }),
  shareDeck: rel(deck_share, deck, { deck_id: 'id' }),
})

// ---- schema-derived row types -------------------------------------------------------------------
export type Deck = Row<typeof deck>
export type Slide = Row<typeof slide>
export type Component = Row<typeof component>

// The render_mode a brand-new deck (and its seed slide) starts in. Markdown-first: most authoring is
// content-first, and spatial mode is a non-destructive per-slide/-deck toggle away. Only affects newly
// created decks — existing decks keep their stored default_slide_mode.
export const DEFAULT_SLIDE_MODE: SlideMode = 'markdown'

// ---- mutator arg schemas (zod; the single source of shape for both tiers + the UI) ---------------

export const createDeckArgs = z.object({
  id: z.string(),
  title: z.string(),
  now: z.number(),
})
export type CreateDeckArgs = z.infer<typeof createDeckArgs>

export const renameDeckArgs = z.object({
  id: z.string(),
  title: z.string(),
  now: z.number(),
})
export type RenameDeckArgs = z.infer<typeof renameDeckArgs>

export const touchDeckArgs = z.object({ id: z.string(), now: z.number() })
export type TouchDeckArgs = z.infer<typeof touchDeckArgs>

export const deleteDeckArgs = z.object({ id: z.string() })
export type DeleteDeckArgs = z.infer<typeof deleteDeckArgs>

export const setDeckThemeArgs = z.object({
  id: z.string(),
  now: z.number(),
  background: z.string().optional(),
  surface: z.string().optional(),
  // Text theme defaults ('' = built-in default). Fonts are family names; colors bare hex (no '#').
  heading_font: z.string().optional(),
  heading_color: z.string().optional(),
  body_font: z.string().optional(),
  body_color: z.string().optional(),
  // Unified theme: deck-wide default text alignment ('' = built-in 'left') and the render_mode
  // stamped on newly added slides ('' = spatial | 'markdown').
  text_align: z.string().optional(),
  default_slide_mode: z.enum(['', 'markdown']).optional(),
  custom_stylesheet: z.string().optional(),
  chosen_presenter: z.string().optional(),
  canned_transition: z.string().optional(),
})
export type SetDeckThemeArgs = z.infer<typeof setDeckThemeArgs>

// Public read-only link. share_token is the link secret (fresh random when turning sharing on, '' when
// turning it off). Owner-only (server-gated).
export const setDeckVisibilityArgs = z.object({
  id: z.string(),
  visibility: z.enum(['private', 'public-read']),
  share_token: z.string(),
  now: z.number(),
})
export type SetDeckVisibilityArgs = z.infer<typeof setDeckVisibilityArgs>

export const addSlideArgs = z.object({
  id: z.string(),
  deckId: z.string(),
  sort: z.string(),
  x: z.number(),
  y: z.number(),
  // '' = spatial (default) | 'markdown'. Add-slide inherits the deck's default_slide_mode.
  render_mode: z.enum(['', 'markdown']).optional(),
  now: z.number(),
})
export type AddSlideArgs = z.infer<typeof addSlideArgs>

export const deleteSlideArgs = z.object({
  id: z.string(),
  componentIds: z.array(z.string()),
})
export type DeleteSlideArgs = z.infer<typeof deleteSlideArgs>

export const reorderSlideArgs = z.object({ id: z.string(), sort: z.string() })
export type ReorderSlideArgs = z.infer<typeof reorderSlideArgs>

export const setSlideTransformArgs = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  z: z.number(),
  rotate_x: z.number(),
  rotate_y: z.number(),
  rotate_z: z.number(),
  imp_scale: z.number(),
  now: z.number(),
})
export type SetSlideTransformArgs = z.infer<typeof setSlideTransformArgs>

export const setSlideThemeArgs = z.object({
  id: z.string(),
  now: z.number(),
  background: z.string().optional(),
  surface: z.string().optional(),
  // Per-slide alignment override ('' = inherit the deck default).
  text_align: z.string().optional(),
})
export type SetSlideThemeArgs = z.infer<typeof setSlideThemeArgs>

export const setSlideMarkdownArgs = z.object({
  id: z.string(),
  markdown: z.string(),
  now: z.number(),
})
export type SetSlideMarkdownArgs = z.infer<typeof setSlideMarkdownArgs>

// Markdown-mode content: a TipTap/ProseMirror document, JSON-stringified. Streamed via `.folded`.
export const setSlideDocArgs = z.object({
  id: z.string(),
  doc: z.string(),
  now: z.number(),
})
export type SetSlideDocArgs = z.infer<typeof setSlideDocArgs>

export const setSlideModeArgs = z.object({
  id: z.string(),
  render_mode: z.enum(['', 'markdown']),
  now: z.number(),
})
export type SetSlideModeArgs = z.infer<typeof setSlideModeArgs>

// Component spatial base — the fields every add-* carries.
const spatialArgs = z.object({
  id: z.string(),
  slideId: z.string(),
  x: z.number(),
  y: z.number(),
  z_order: z.number(),
})

// color/font_family = '' means "inherit the deck theme default for text_type" (heading | body).
export const addTextArgs = spatialArgs.extend({
  text: z.string(),
  size: z.number(),
  color: z.string(),
  font_family: z.string(),
  text_type: z.string(),
})
export type AddTextArgs = z.infer<typeof addTextArgs>

export const addImageArgs = spatialArgs.extend({
  src: z.string(),
  image_type: z.string(),
  scale_w: z.number(),
  scale_h: z.number(),
})
export type AddImageArgs = z.infer<typeof addImageArgs>

export const addShapeArgs = spatialArgs.extend({
  shape: z.string(),
  markup: z.string(),
  fill: z.string(),
})
export type AddShapeArgs = z.infer<typeof addShapeArgs>

export const addVideoArgs = spatialArgs.extend({
  src: z.string(),
  video_type: z.string(),
  src_type: z.string(),
  short_src: z.string(),
})
export type AddVideoArgs = z.infer<typeof addVideoArgs>

export const addWebframeArgs = spatialArgs.extend({ src: z.string() })
export type AddWebframeArgs = z.infer<typeof addWebframeArgs>

export const moveComponentArgs = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
})
export type MoveComponentArgs = z.infer<typeof moveComponentArgs>

export const transformComponentArgs = z.object({
  id: z.string(),
  scale_x: z.number(),
  scale_y: z.number(),
  scale_w: z.number(),
  scale_h: z.number(),
  rotate: z.number(),
  skew_x: z.number(),
  skew_y: z.number(),
})
export type TransformComponentArgs = z.infer<typeof transformComponentArgs>

export const setComponentZArgs = z.object({
  id: z.string(),
  z_order: z.number(),
})
export type SetComponentZArgs = z.infer<typeof setComponentZArgs>

export const setComponentClassesArgs = z.object({
  id: z.string(),
  custom_classes: z.string(),
})
export type SetComponentClassesArgs = z.infer<typeof setComponentClassesArgs>

export const removeComponentArgs = z.object({ id: z.string() })
export type RemoveComponentArgs = z.infer<typeof removeComponentArgs>

export const setTextArgs = z.object({
  id: z.string(),
  text: z.string(),
  size: z.number(),
  color: z.string(),
  font_family: z.string(),
  text_type: z.string(),
})
export type SetTextArgs = z.infer<typeof setTextArgs>

export const setShapeFillArgs = z.object({ id: z.string(), fill: z.string() })
export type SetShapeFillArgs = z.infer<typeof setShapeFillArgs>

export const mintCustomColorArgs = z.object({
  id: z.string(),
  deckId: z.string(),
  klass: z.string(),
  style: z.string(),
})
export type MintCustomColorArgs = z.infer<typeof mintCustomColorArgs>

// id = the deck_share row id; userId = the collaborator's Strut id; role = editor|viewer.
export const addCollaboratorArgs = z.object({
  id: z.string(),
  deckId: z.string(),
  userId: z.string(),
  role: z.enum(['editor', 'viewer']),
  now: z.number(),
})
export type AddCollaboratorArgs = z.infer<typeof addCollaboratorArgs>

export const removeCollaboratorArgs = z.object({ id: z.string() })
export type RemoveCollaboratorArgs = z.infer<typeof removeCollaboratorArgs>

// display_name only — the profile id is the acting principal (ctx.user), never a client arg.
export const setDisplayNameArgs = z.object({
  display_name: z.string(),
  now: z.number(),
})
export type SetDisplayNameArgs = z.infer<typeof setDisplayNameArgs>

// ---- isomorphic mutators (one shared body each; run on BOTH tiers) --------------------------------

const spatialBase = (a: z.infer<typeof spatialArgs>) => ({
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
  createDeck: shared(
    createDeckArgs,
    function* (tx: IsoTx, a: CreateDeckArgs, ctx: MutatorCtx): MutationGen {
      yield tx.insert('deck', {
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
        // Author = the acting principal. The client predicts currentUser() (so the optimistic row passes
        // the owner-scoped decksQuery immediately); the server injects the AUTHENTICATED principal.
        owner_id: ctx.user,
        visibility: 'private',
        share_token: '',
        heading_font: '',
        heading_color: '',
        body_font: '',
        body_color: '',
        default_slide_mode: DEFAULT_SLIDE_MODE,
        text_align: '',
      })
    },
  ),

  renameDeck: shared(
    renameDeckArgs,
    function* (tx: IsoTx, a: RenameDeckArgs): MutationGen {
      yield tx.update('deck', { id: a.id, title: a.title, modified: a.now })
    },
  ),

  touchDeck: shared(
    touchDeckArgs,
    function* (tx: IsoTx, a: TouchDeckArgs): MutationGen {
      yield tx.update('deck', { id: a.id, modified: a.now })
    },
  ),

  // Client predicts the deck row removal; the server twin (server/rindle-api.ts) cascades slides +
  // components under an owner gate, and those deletions arrive via sync.
  deleteDeck: shared(
    deleteDeckArgs,
    function* (tx: IsoTx, a: DeleteDeckArgs): MutationGen {
      yield tx.delete('deck', { id: a.id })
    },
  ),

  setDeckTheme: shared(
    setDeckThemeArgs,
    function* (tx: IsoTx, a: SetDeckThemeArgs): MutationGen {
      const row: KeyedRow = { id: a.id, modified: a.now }
      if (a.background !== undefined) row.background = a.background
      if (a.surface !== undefined) row.surface = a.surface
      if (a.heading_font !== undefined) row.heading_font = a.heading_font
      if (a.heading_color !== undefined) row.heading_color = a.heading_color
      if (a.body_font !== undefined) row.body_font = a.body_font
      if (a.body_color !== undefined) row.body_color = a.body_color
      if (a.text_align !== undefined) row.text_align = a.text_align
      if (a.default_slide_mode !== undefined)
        row.default_slide_mode = a.default_slide_mode
      if (a.custom_stylesheet !== undefined)
        row.custom_stylesheet = a.custom_stylesheet
      if (a.chosen_presenter !== undefined)
        row.chosen_presenter = a.chosen_presenter
      if (a.canned_transition !== undefined)
        row.canned_transition = a.canned_transition
      yield tx.update('deck', row)
    },
  ),

  // Public link: flip visibility + (re)mint or clear the share token. Owner-gated on the server.
  setDeckVisibility: shared(
    setDeckVisibilityArgs,
    function* (tx: IsoTx, a: SetDeckVisibilityArgs): MutationGen {
      yield tx.update('deck', {
        id: a.id,
        visibility: a.visibility,
        share_token: a.share_token,
        modified: a.now,
      })
    },
  ),

  addSlide: shared(
    addSlideArgs,
    function* (tx: IsoTx, a: AddSlideArgs): MutationGen {
      yield tx.insert('slide', {
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
        markdown: '',
        doc: '',
        render_mode: a.render_mode ?? '',
        text_align: '',
      })
    },
  ),

  deleteSlide: shared(
    deleteSlideArgs,
    function* (tx: IsoTx, a: DeleteSlideArgs): MutationGen {
      for (const id of a.componentIds) yield tx.delete('component', { id })
      yield tx.delete('slide', { id: a.id })
    },
  ),

  reorderSlide: shared(
    reorderSlideArgs,
    function* (tx: IsoTx, a: ReorderSlideArgs): MutationGen {
      yield tx.update('slide', { id: a.id, sort: a.sort })
    },
  ),

  setSlideTransform: shared(
    setSlideTransformArgs,
    function* (tx: IsoTx, a: SetSlideTransformArgs): MutationGen {
      yield tx.update('slide', {
        id: a.id,
        x: a.x,
        y: a.y,
        z: a.z,
        rotate_x: a.rotate_x,
        rotate_y: a.rotate_y,
        rotate_z: a.rotate_z,
        imp_scale: a.imp_scale,
        modified: a.now,
      })
    },
  ),

  setSlideTheme: shared(
    setSlideThemeArgs,
    function* (tx: IsoTx, a: SetSlideThemeArgs): MutationGen {
      const row: KeyedRow = { id: a.id, modified: a.now }
      if (a.background !== undefined) row.background = a.background
      if (a.surface !== undefined) row.surface = a.surface
      if (a.text_align !== undefined) row.text_align = a.text_align
      yield tx.update('slide', row)
    },
  ),

  // Markdown source (per-slide). Non-destructive re. components — a plain column patch.
  setSlideMarkdown: shared(
    setSlideMarkdownArgs,
    function* (tx: IsoTx, a: SetSlideMarkdownArgs): MutationGen {
      yield tx.update('slide', {
        id: a.id,
        markdown: a.markdown,
        modified: a.now,
      })
    },
  ),

  // Markdown-mode content as a TipTap doc (JSON string). Plain column patch, streamed via `.folded`.
  setSlideDoc: shared(
    setSlideDocArgs,
    function* (tx: IsoTx, a: SetSlideDocArgs): MutationGen {
      yield tx.update('slide', { id: a.id, doc: a.doc, modified: a.now })
    },
  ),

  // Flip a slide between spatial + markdown mode; hidden components are preserved in the DB.
  setSlideMode: shared(
    setSlideModeArgs,
    function* (tx: IsoTx, a: SetSlideModeArgs): MutationGen {
      yield tx.update('slide', {
        id: a.id,
        render_mode: a.render_mode,
        modified: a.now,
      })
    },
  ),

  // One `component` table: each insert stamps `type`, the shared spatial base + `fill` column, and the
  // type-specific `props` JSON object. `fill` is only meaningful for shapes; '' elsewhere.
  addText: shared(
    addTextArgs,
    function* (tx: IsoTx, a: AddTextArgs): MutationGen {
      yield tx.insert('component', {
        ...spatialBase(a),
        type: 'text',
        fill: '',
        props: componentProps('text', a),
      })
    },
  ),

  addImage: shared(
    addImageArgs,
    function* (tx: IsoTx, a: AddImageArgs): MutationGen {
      yield tx.insert('component', {
        ...spatialBase(a),
        scale_w: a.scale_w,
        scale_h: a.scale_h,
        type: 'image',
        fill: '',
        props: componentProps('image', a),
      })
    },
  ),

  addShape: shared(
    addShapeArgs,
    function* (tx: IsoTx, a: AddShapeArgs): MutationGen {
      yield tx.insert('component', {
        ...spatialBase(a),
        type: 'shape',
        fill: a.fill,
        props: componentProps('shape', a),
      })
    },
  ),

  addVideo: shared(
    addVideoArgs,
    function* (tx: IsoTx, a: AddVideoArgs): MutationGen {
      yield tx.insert('component', {
        ...spatialBase(a),
        type: 'video',
        fill: '',
        props: componentProps('video', a),
      })
    },
  ),

  addWebframe: shared(
    addWebframeArgs,
    function* (tx: IsoTx, a: AddWebframeArgs): MutationGen {
      yield tx.insert('component', {
        ...spatialBase(a),
        type: 'webframe',
        fill: '',
        props: componentProps('webframe', a),
      })
    },
  ),

  moveComponent: shared(
    moveComponentArgs,
    function* (tx: IsoTx, a: MoveComponentArgs): MutationGen {
      yield tx.update('component', { id: a.id, x: a.x, y: a.y })
    },
  ),

  transformComponent: shared(
    transformComponentArgs,
    function* (tx: IsoTx, a: TransformComponentArgs): MutationGen {
      yield tx.update('component', {
        id: a.id,
        scale_x: a.scale_x,
        scale_y: a.scale_y,
        scale_w: a.scale_w,
        scale_h: a.scale_h,
        rotate: a.rotate,
        skew_x: a.skew_x,
        skew_y: a.skew_y,
      })
    },
  ),

  setComponentZ: shared(
    setComponentZArgs,
    function* (tx: IsoTx, a: SetComponentZArgs): MutationGen {
      yield tx.update('component', { id: a.id, z_order: a.z_order })
    },
  ),

  setComponentClasses: shared(
    setComponentClassesArgs,
    function* (tx: IsoTx, a: SetComponentClassesArgs): MutationGen {
      yield tx.update('component', {
        id: a.id,
        custom_classes: a.custom_classes,
      })
    },
  ),

  removeComponent: shared(
    removeComponentArgs,
    function* (tx: IsoTx, a: RemoveComponentArgs): MutationGen {
      yield tx.delete('component', { id: a.id })
    },
  ),

  // Rewrites the whole text `props` object (it carries all text fields, so no partial-merge needed).
  setText: shared(
    setTextArgs,
    function* (tx: IsoTx, a: SetTextArgs): MutationGen {
      yield tx.update('component', {
        id: a.id,
        props: componentProps('text', a),
      })
    },
  ),

  // `fill` is a column, so this is a plain per-column patch — concurrent fill vs. any other edit survive.
  setShapeFill: shared(
    setShapeFillArgs,
    function* (tx: IsoTx, a: SetShapeFillArgs): MutationGen {
      yield tx.update('component', { id: a.id, fill: a.fill })
    },
  ),

  mintCustomColor: shared(
    mintCustomColorArgs,
    function* (tx: IsoTx, a: MintCustomColorArgs): MutationGen {
      yield tx.insert('custom_background', {
        id: a.id,
        deck_id: a.deckId,
        klass: a.klass,
        style: a.style,
      })
    },
  ),

  // Sharing: only the deck OWNER may add/remove collaborators (server-gated).
  addCollaborator: shared(
    addCollaboratorArgs,
    function* (tx: IsoTx, a: AddCollaboratorArgs): MutationGen {
      yield tx.insert('deck_share', {
        id: a.id,
        deck_id: a.deckId,
        user_id: a.userId,
        role: a.role,
        created: a.now,
      })
    },
  ),

  removeCollaborator: shared(
    removeCollaboratorArgs,
    function* (tx: IsoTx, a: RemoveCollaboratorArgs): MutationGen {
      yield tx.delete('deck_share', { id: a.id })
    },
  ),

  // Profile display name, keyed to the acting principal. upsert = insert-or-replace on the pk, so the
  // first write (before the row exists) and every later edit are the same op. The server injects the
  // AUTHENTICATED principal as ctx.user, so a client can't write another user's profile.
  setDisplayName: shared(
    setDisplayNameArgs,
    function* (tx: IsoTx, a: SetDisplayNameArgs, ctx: MutatorCtx): MutationGen {
      yield tx.upsert('user_profile', {
        id: ctx.user,
        display_name: a.display_name,
        updated: a.now,
      })
    },
  ),
} satisfies ClientRegistry
