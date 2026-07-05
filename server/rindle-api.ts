// Strut's Rindle API — stateless: validates args, runs AUTHORITATIVE SQL against the daemon, and
// registers the named queries. Mirrors the predicted client mutators in shared/app-def.ts.
//
// Hosted by the TanStack Start server routes in src/routes/api.rindle.* (no separate process):
// they import handleRindleJson() below. The daemon control plane is :7600 (RINDLE_DAEMON_URL).

import {
  createRindleApiServer,
  defineApiMutators,
  registerQueries,
  RindleApiError,
  type ApiContext,
  type ApiMutators,
  type SqlMutationTx,
} from '@rindle/api-server'
import { HttpRindleDaemonClient, type WireValue } from '@rindle/daemon-client'
import { serverQueries } from './queries.ts'
import { serializeProps } from '../shared/componentProps.ts'
import type {
  AddCollaboratorArgs,
  AddImageArgs,
  AddShapeArgs,
  AddTextArgs,
  AddVideoArgs,
  AddWebframeArgs,
  AddSlideArgs,
  CreateDeckArgs,
  DeleteDeckArgs,
  DeleteSlideArgs,
  MintCustomColorArgs,
  MoveComponentArgs,
  RemoveCollaboratorArgs,
  RemoveComponentArgs,
  RenameDeckArgs,
  ReorderSlideArgs,
  SetComponentClassesArgs,
  SetComponentZArgs,
  SetDeckThemeArgs,
  SetDeckVisibilityArgs,
  SetDisplayNameArgs,
  SetShapeFillArgs,
  SetSlideDocArgs,
  SetSlideMarkdownArgs,
  SetSlideModeArgs,
  SetSlideThemeArgs,
  SetSlideTransformArgs,
  SetTextArgs,
  TouchDeckArgs,
  TransformComponentArgs,
} from '../shared/app-def.ts'
import { DEFAULT_SLIDE_MODE } from '../shared/app-def.ts'

export type User = string
const DAEMON_URL = process.env.RINDLE_DAEMON_URL ?? 'http://127.0.0.1:7600'

// ---- small SQL helpers so server twins mirror the client row-shapes 1:1 -------------------------

function insert(
  tx: SqlMutationTx,
  table: string,
  row: Record<string, WireValue>,
) {
  const cols = Object.keys(row)
  tx.exec(
    `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
    cols.map((c) => row[c]),
  )
}

// ---- access-guarded writes (defense in depth; the editor UI also gates editing by role) ----------
// Decks the principal may EDIT: owns it, or is an 'editor' collaborator. Binds two params: (user, user).
const EDITABLE_DECKS = `(SELECT id FROM deck WHERE owner_id = ? UNION SELECT deck_id FROM deck_share WHERE user_id = ? AND role = 'editor')`
// Slides whose owning deck the principal may edit. Binds two params: (user, user).
const EDITABLE_SLIDES = `(SELECT id FROM slide WHERE deck_id IN ${EDITABLE_DECKS})`

// INSERT a row only when the `guard` boolean SQL expression holds (`guardParams` bind its '?'s). An
// unauthorized write inserts 0 rows (a silent no-op) rather than corrupting another user's deck.
function insertIf(
  tx: SqlMutationTx,
  table: string,
  row: Record<string, WireValue>,
  guard: string,
  guardParams: WireValue[],
) {
  const cols = Object.keys(row)
  tx.exec(
    `INSERT INTO ${table} (${cols.join(', ')}) SELECT ${cols.map(() => '?').join(', ')} WHERE ${guard}`,
    [...cols.map((c) => row[c]), ...guardParams],
  )
}

// UPDATE ... WHERE id = ? AND <guard>. Unauthorized → 0 rows changed.
function updateIf(
  tx: SqlMutationTx,
  table: string,
  id: string,
  row: Record<string, WireValue>,
  guard: string,
  guardParams: WireValue[],
) {
  const cols = Object.keys(row)
  if (cols.length === 0) return
  tx.exec(
    `UPDATE ${table} SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ? AND ${guard}`,
    [...cols.map((c) => row[c]), id, ...guardParams],
  )
}

const spatialBase = (a: {
  slideId: string
  z_order: number
  x: number
  y: number
}) => ({
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

// ---- authoritative mutators ---------------------------------------------------------------------

const mutators = defineApiMutators<User, ApiMutators<User>>({
  createDeck: (tx, a: CreateDeckArgs, ctx) =>
    insert(tx, 'deck', {
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
      // Authoritative ownership: trust the request principal, never the client-supplied a.ownerId.
      owner_id: ctx.user,
      visibility: 'private',
      share_token: '',
      heading_font: '',
      heading_color: '',
      body_font: '',
      body_color: '',
      default_slide_mode: DEFAULT_SLIDE_MODE,
      text_align: '',
    }),

  renameDeck: (tx, a: RenameDeckArgs, ctx) =>
    updateIf(
      tx,
      'deck',
      a.id,
      { title: a.title, modified: a.now },
      `id IN ${EDITABLE_DECKS}`,
      [ctx.user, ctx.user],
    ),

  touchDeck: (tx, a: TouchDeckArgs, ctx) =>
    updateIf(tx, 'deck', a.id, { modified: a.now }, `id IN ${EDITABLE_DECKS}`, [
      ctx.user,
      ctx.user,
    ]),

  // Owner-only: cascade is gated on ownership so a non-owner deletes nothing.
  deleteDeck: (tx, a: DeleteDeckArgs, ctx) => {
    const owner = `EXISTS (SELECT 1 FROM deck WHERE id = ? AND owner_id = ?)`
    tx.exec(
      `DELETE FROM component WHERE slide_id IN (SELECT id FROM slide WHERE deck_id = ?) AND ${owner}`,
      [a.id, a.id, ctx.user],
    )
    tx.exec(`DELETE FROM custom_background WHERE deck_id = ? AND ${owner}`, [
      a.id,
      a.id,
      ctx.user,
    ])
    tx.exec(`DELETE FROM deck_share WHERE deck_id = ? AND ${owner}`, [
      a.id,
      a.id,
      ctx.user,
    ])
    tx.exec(`DELETE FROM slide WHERE deck_id = ? AND ${owner}`, [
      a.id,
      a.id,
      ctx.user,
    ])
    tx.exec('DELETE FROM deck WHERE id = ? AND owner_id = ?', [a.id, ctx.user])
  },

  setDeckTheme: (tx, a: SetDeckThemeArgs, ctx) => {
    const row: Record<string, WireValue> = { modified: a.now }
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
    updateIf(tx, 'deck', a.id, row, `id IN ${EDITABLE_DECKS}`, [
      ctx.user,
      ctx.user,
    ])
  },

  addSlide: (tx, a: AddSlideArgs, ctx) =>
    insertIf(
      tx,
      'slide',
      {
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
        // Match the client predicted twin: stamp text_align = '' (deck-inherit) so the
        // authoritative row isn't NULL where the client optimistically predicts ''.
        text_align: '',
      },
      `? IN ${EDITABLE_DECKS}`,
      [a.deckId, ctx.user, ctx.user],
    ),

  // Cascade by slide_id, gated so only editors of the owning deck can delete.
  deleteSlide: (tx, a: DeleteSlideArgs, ctx) => {
    tx.exec(
      `DELETE FROM component WHERE slide_id = ? AND slide_id IN ${EDITABLE_SLIDES}`,
      [a.id, ctx.user, ctx.user],
    )
    tx.exec(`DELETE FROM slide WHERE id = ? AND id IN ${EDITABLE_SLIDES}`, [
      a.id,
      ctx.user,
      ctx.user,
    ])
  },

  reorderSlide: (tx, a: ReorderSlideArgs, ctx) =>
    updateIf(
      tx,
      'slide',
      a.id,
      { sort: a.sort },
      `deck_id IN ${EDITABLE_DECKS}`,
      [ctx.user, ctx.user],
    ),

  setSlideTransform: (tx, a: SetSlideTransformArgs, ctx) =>
    updateIf(
      tx,
      'slide',
      a.id,
      {
        x: a.x,
        y: a.y,
        z: a.z,
        rotate_x: a.rotate_x,
        rotate_y: a.rotate_y,
        rotate_z: a.rotate_z,
        imp_scale: a.imp_scale,
        modified: a.now,
      },
      `deck_id IN ${EDITABLE_DECKS}`,
      [ctx.user, ctx.user],
    ),

  setSlideTheme: (tx, a: SetSlideThemeArgs, ctx) => {
    const row: Record<string, WireValue> = { modified: a.now }
    if (a.background !== undefined) row.background = a.background
    if (a.surface !== undefined) row.surface = a.surface
    if (a.text_align !== undefined) row.text_align = a.text_align
    updateIf(tx, 'slide', a.id, row, `deck_id IN ${EDITABLE_DECKS}`, [
      ctx.user,
      ctx.user,
    ])
  },

  setSlideMarkdown: (tx, a: SetSlideMarkdownArgs, ctx) =>
    updateIf(
      tx,
      'slide',
      a.id,
      { markdown: a.markdown, modified: a.now },
      `deck_id IN ${EDITABLE_DECKS}`,
      [ctx.user, ctx.user],
    ),

  setSlideDoc: (tx, a: SetSlideDocArgs, ctx) =>
    updateIf(
      tx,
      'slide',
      a.id,
      { doc: a.doc, modified: a.now },
      `deck_id IN ${EDITABLE_DECKS}`,
      [ctx.user, ctx.user],
    ),

  setSlideMode: (tx, a: SetSlideModeArgs, ctx) =>
    updateIf(
      tx,
      'slide',
      a.id,
      { render_mode: a.render_mode, modified: a.now },
      `deck_id IN ${EDITABLE_DECKS}`,
      [ctx.user, ctx.user],
    ),

  // All five inserts collapse to one `component` row: `type` + spatial base + `fill` column + the
  // type-specific `props` JSON (serializeProps mirrors the client byte-for-byte). `fill` is '' for
  // non-shapes.
  addText: (tx, a: AddTextArgs, ctx) =>
    insertIf(
      tx,
      'component',
      {
        id: a.id,
        ...spatialBase(a),
        type: 'text',
        fill: '',
        props: serializeProps('text', a),
      },
      `? IN ${EDITABLE_SLIDES}`,
      [a.slideId, ctx.user, ctx.user],
    ),

  addImage: (tx, a: AddImageArgs, ctx) =>
    insertIf(
      tx,
      'component',
      {
        id: a.id,
        ...spatialBase(a),
        scale_w: a.scale_w,
        scale_h: a.scale_h,
        type: 'image',
        fill: '',
        props: serializeProps('image', a),
      },
      `? IN ${EDITABLE_SLIDES}`,
      [a.slideId, ctx.user, ctx.user],
    ),

  addShape: (tx, a: AddShapeArgs, ctx) =>
    insertIf(
      tx,
      'component',
      {
        id: a.id,
        ...spatialBase(a),
        type: 'shape',
        fill: a.fill,
        props: serializeProps('shape', a),
      },
      `? IN ${EDITABLE_SLIDES}`,
      [a.slideId, ctx.user, ctx.user],
    ),

  addVideo: (tx, a: AddVideoArgs, ctx) =>
    insertIf(
      tx,
      'component',
      {
        id: a.id,
        ...spatialBase(a),
        type: 'video',
        fill: '',
        props: serializeProps('video', a),
      },
      `? IN ${EDITABLE_SLIDES}`,
      [a.slideId, ctx.user, ctx.user],
    ),

  addWebframe: (tx, a: AddWebframeArgs, ctx) =>
    insertIf(
      tx,
      'component',
      {
        id: a.id,
        ...spatialBase(a),
        type: 'webframe',
        fill: '',
        props: serializeProps('webframe', a),
      },
      `? IN ${EDITABLE_SLIDES}`,
      [a.slideId, ctx.user, ctx.user],
    ),

  moveComponent: (tx, a: MoveComponentArgs, ctx) =>
    updateIf(
      tx,
      'component',
      a.id,
      { x: a.x, y: a.y },
      `slide_id IN ${EDITABLE_SLIDES}`,
      [ctx.user, ctx.user],
    ),

  transformComponent: (tx, a: TransformComponentArgs, ctx) =>
    updateIf(
      tx,
      'component',
      a.id,
      {
        scale_x: a.scale_x,
        scale_y: a.scale_y,
        scale_w: a.scale_w,
        scale_h: a.scale_h,
        rotate: a.rotate,
        skew_x: a.skew_x,
        skew_y: a.skew_y,
      },
      `slide_id IN ${EDITABLE_SLIDES}`,
      [ctx.user, ctx.user],
    ),

  setComponentZ: (tx, a: SetComponentZArgs, ctx) =>
    updateIf(
      tx,
      'component',
      a.id,
      { z_order: a.z_order },
      `slide_id IN ${EDITABLE_SLIDES}`,
      [ctx.user, ctx.user],
    ),

  setComponentClasses: (tx, a: SetComponentClassesArgs, ctx) =>
    updateIf(
      tx,
      'component',
      a.id,
      { custom_classes: a.custom_classes },
      `slide_id IN ${EDITABLE_SLIDES}`,
      [ctx.user, ctx.user],
    ),

  removeComponent: (tx, a: RemoveComponentArgs, ctx) =>
    tx.exec(
      `DELETE FROM component WHERE id = ? AND slide_id IN ${EDITABLE_SLIDES}`,
      [a.id, ctx.user, ctx.user],
    ),

  // Rewrites the whole text `props` blob (carries all four text fields). Concurrent edits to a shape's
  // `fill` (a column) and a text's props never touch the same cell, so both survive the rebase.
  setText: (tx, a: SetTextArgs, ctx) =>
    updateIf(
      tx,
      'component',
      a.id,
      { props: serializeProps('text', a) },
      `slide_id IN ${EDITABLE_SLIDES}`,
      [ctx.user, ctx.user],
    ),

  setShapeFill: (tx, a: SetShapeFillArgs, ctx) =>
    updateIf(
      tx,
      'component',
      a.id,
      { fill: a.fill },
      `slide_id IN ${EDITABLE_SLIDES}`,
      [ctx.user, ctx.user],
    ),

  mintCustomColor: (tx, a: MintCustomColorArgs, ctx) =>
    insertIf(
      tx,
      'custom_background',
      { id: a.id, deck_id: a.deckId, klass: a.klass, style: a.style },
      `? IN ${EDITABLE_DECKS}`,
      [a.deckId, ctx.user, ctx.user],
    ),

  // Sharing: only the deck OWNER may add/remove collaborators (the insert/delete is gated on ownership).
  addCollaborator: (tx, a: AddCollaboratorArgs, ctx) =>
    insertIf(
      tx,
      'deck_share',
      {
        id: a.id,
        deck_id: a.deckId,
        user_id: a.userId,
        role: a.role,
        created: a.now,
      },
      `EXISTS (SELECT 1 FROM deck WHERE id = ? AND owner_id = ?)`,
      [a.deckId, ctx.user],
    ),

  removeCollaborator: (tx, a: RemoveCollaboratorArgs, ctx) =>
    tx.exec(
      'DELETE FROM deck_share WHERE id = ? AND deck_id IN (SELECT id FROM deck WHERE owner_id = ?)',
      [a.id, ctx.user],
    ),

  // Public link: owner-only flip of visibility + share token (the gate is on deck ownership).
  setDeckVisibility: (tx, a: SetDeckVisibilityArgs, ctx) =>
    updateIf(
      tx,
      'deck',
      a.id,
      {
        visibility: a.visibility,
        share_token: a.share_token,
        modified: a.now,
      },
      `owner_id = ?`,
      [ctx.user],
    ),

  // Profile: upsert keyed to the authenticated principal (never the client-supplied a.id).
  setDisplayName: (tx, a: SetDisplayNameArgs, ctx) =>
    tx.exec(
      'INSERT INTO user_profile (id, display_name, updated) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET display_name = excluded.display_name, updated = excluded.updated',
      [ctx.user, a.display_name, a.now],
    ),
})

// ---- server wiring ------------------------------------------------------------------------------

const api = createRindleApiServer<User>({
  daemon: new HttpRindleDaemonClient({
    baseUrl: DAEMON_URL,
    headers: {
      authorization: `Bearer ${process.env.RINDLE_DAEMON_TOKEN ?? ''}`,
    },
  }),
  queries: registerQueries<User>(serverQueries),
  mutators,
  // Coarse gate: require a non-empty principal. Row-level access lives where Rindle gives the tools —
  // queries are owner/share-scoped (see shared/queries.ts) and mutators are access-guarded SQL writes
  // (EDITABLE_DECKS/EDITABLE_SLIDES above). The authorize hooks can't read the DB anyway (RINDLE_NOTES #14).
  authorizeQuery: ({ user }) => typeof user === 'string' && user.length > 0,
  authorizeMutation: ({ user }) => typeof user === 'string' && user.length > 0,
})

// Web-standard entrypoint used by the TanStack Start server routes (src/routes/api.rindle.*).
// The app no longer runs a second HTTP process — Start hosts these handlers same-origin.
export type RindleRouteKind = 'query' | 'read' | 'mutate'

export async function handleRindleJson(
  kind: RindleRouteKind,
  request: Request,
): Promise<Response> {
  try {
    const body = JSON.parse((await request.text()) || '{}')
    const ctx: ApiContext<User> = {
      user: request.headers.get('x-user') ?? '',
      request,
    }
    const out =
      kind === 'query'
        ? await api.handleQueryJson(body, ctx)
        : kind === 'read'
          ? await api.handleReadJson(body, ctx)
          : await api.handleMutateJson(body, ctx)
    return Response.json(out)
  } catch (err) {
    const status = err instanceof RindleApiError ? err.status : 500
    const message = err instanceof Error ? err.message : 'internal error'
    return Response.json({ error: message }, { status })
  }
}

// One-shot SSR read of a named query (SSR-DESIGN.md §6): the server-side `ServerStore.preload` calls
// this to seed a route's first paint. Same authority path as the /api/rindle/read route — the query
// name resolves to its AUTHORITATIVE (gated) AST, so the SSR snapshot is scoped exactly like the live
// subscription. `user` need only be a non-empty principal for the coarse `authorizeQuery`; the public
// share query is token-gated (bearer) and ignores it.
export async function readNamedQuery(
  name: string,
  args: unknown,
  user: string,
  request?: Request,
): Promise<{ rows: { cols: Record<string, unknown> }[]; cvMin?: number }> {
  const ctx: ApiContext<User> = {
    user,
    request: request ?? new Request('http://localhost/api/rindle/read'),
  }
  const out = await api.handleReadJson({ name, args }, ctx)
  return { rows: out.rows, cvMin: out.cvMin }
}
