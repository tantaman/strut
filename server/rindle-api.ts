// Strut's Rindle API server — stateless: validates args, runs AUTHORITATIVE SQL against the daemon,
// and registers the named queries. Mirrors the predicted client mutators in shared/app-def.ts.
//
// Dev: `node server/rindle-api.ts` (or `tsx server/rindle-api.ts`) on :7700; the web dev server
// proxies /api/rindle/* here. The daemon control plane is :7600.

import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http'
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
import { isComponentTable } from '../shared/app-def.ts'
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
  SetDisplayNameArgs,
  SetShapeFillArgs,
  SetSlideThemeArgs,
  SetSlideTransformArgs,
  SetTextArgs,
  TouchDeckArgs,
  TransformComponentArgs,
} from '../shared/app-def.ts'

type User = string
const PORT = Number(process.env.STRUT_API_PORT ?? 7700)
const DAEMON_URL = process.env.RINDLE_DAEMON_URL ?? 'http://127.0.0.1:7600'

// ---- small SQL helpers so server twins mirror the client row-shapes 1:1 -------------------------

const COMPONENT_TABLES = [
  'text_component',
  'image_component',
  'shape_component',
  'video_component',
  'webframe_component',
] as const

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

function compTable(t: string): string {
  if (!isComponentTable(t))
    throw new RindleApiError(
      'bad-request',
      `unknown component table: ${t}`,
      400,
    )
  return t
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
    for (const t of COMPONENT_TABLES)
      tx.exec(
        `DELETE FROM ${t} WHERE slide_id IN (SELECT id FROM slide WHERE deck_id = ?) AND ${owner}`,
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
      },
      `? IN ${EDITABLE_DECKS}`,
      [a.deckId, ctx.user, ctx.user],
    ),

  // Cascade by slide_id, gated so only editors of the owning deck can delete.
  deleteSlide: (tx, a: DeleteSlideArgs, ctx) => {
    for (const t of COMPONENT_TABLES)
      tx.exec(
        `DELETE FROM ${t} WHERE slide_id = ? AND slide_id IN ${EDITABLE_SLIDES}`,
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
    updateIf(tx, 'slide', a.id, row, `deck_id IN ${EDITABLE_DECKS}`, [
      ctx.user,
      ctx.user,
    ])
  },

  addText: (tx, a: AddTextArgs, ctx) =>
    insertIf(
      tx,
      'text_component',
      {
        id: a.id,
        ...spatialBase(a),
        text: a.text,
        size: a.size,
        color: a.color,
        font_family: a.font_family,
      },
      `? IN ${EDITABLE_SLIDES}`,
      [a.slideId, ctx.user, ctx.user],
    ),

  addImage: (tx, a: AddImageArgs, ctx) =>
    insertIf(
      tx,
      'image_component',
      {
        id: a.id,
        ...spatialBase(a),
        scale_w: a.scale_w,
        scale_h: a.scale_h,
        src: a.src,
        image_type: a.image_type,
      },
      `? IN ${EDITABLE_SLIDES}`,
      [a.slideId, ctx.user, ctx.user],
    ),

  addShape: (tx, a: AddShapeArgs, ctx) =>
    insertIf(
      tx,
      'shape_component',
      {
        id: a.id,
        ...spatialBase(a),
        shape: a.shape,
        markup: a.markup,
        fill: a.fill,
      },
      `? IN ${EDITABLE_SLIDES}`,
      [a.slideId, ctx.user, ctx.user],
    ),

  addVideo: (tx, a: AddVideoArgs, ctx) =>
    insertIf(
      tx,
      'video_component',
      {
        id: a.id,
        ...spatialBase(a),
        src: a.src,
        video_type: a.video_type,
        src_type: a.src_type,
        short_src: a.short_src,
      },
      `? IN ${EDITABLE_SLIDES}`,
      [a.slideId, ctx.user, ctx.user],
    ),

  addWebframe: (tx, a: AddWebframeArgs, ctx) =>
    insertIf(
      tx,
      'webframe_component',
      { id: a.id, ...spatialBase(a), src: a.src },
      `? IN ${EDITABLE_SLIDES}`,
      [a.slideId, ctx.user, ctx.user],
    ),

  moveComponent: (tx, a: MoveComponentArgs, ctx) =>
    updateIf(
      tx,
      compTable(a.table),
      a.id,
      { x: a.x, y: a.y },
      `slide_id IN ${EDITABLE_SLIDES}`,
      [ctx.user, ctx.user],
    ),

  transformComponent: (tx, a: TransformComponentArgs, ctx) =>
    updateIf(
      tx,
      compTable(a.table),
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
      compTable(a.table),
      a.id,
      { z_order: a.z_order },
      `slide_id IN ${EDITABLE_SLIDES}`,
      [ctx.user, ctx.user],
    ),

  setComponentClasses: (tx, a: SetComponentClassesArgs, ctx) =>
    updateIf(
      tx,
      compTable(a.table),
      a.id,
      { custom_classes: a.custom_classes },
      `slide_id IN ${EDITABLE_SLIDES}`,
      [ctx.user, ctx.user],
    ),

  removeComponent: (tx, a: RemoveComponentArgs, ctx) =>
    tx.exec(
      `DELETE FROM ${compTable(a.table)} WHERE id = ? AND slide_id IN ${EDITABLE_SLIDES}`,
      [a.id, ctx.user, ctx.user],
    ),

  setText: (tx, a: SetTextArgs, ctx) =>
    updateIf(
      tx,
      'text_component',
      a.id,
      {
        text: a.text,
        size: a.size,
        color: a.color,
        font_family: a.font_family,
      },
      `slide_id IN ${EDITABLE_SLIDES}`,
      [ctx.user, ctx.user],
    ),

  setShapeFill: (tx, a: SetShapeFillArgs, ctx) =>
    updateIf(
      tx,
      'shape_component',
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

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (c) => (data += c))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

createServer((req: IncomingMessage, res: ServerResponse) => {
  void (async () => {
    try {
      if (req.method !== 'POST') {
        res.writeHead(405).end('method not allowed')
        return
      }
      const body = JSON.parse((await readBody(req)) || '{}')
      const ctx: ApiContext<User> = {
        user: (req.headers['x-user'] as string) ?? '',
        request: req,
      }
      let out: unknown
      if (req.url === api.routes.query)
        out = await api.handleQueryJson(body, ctx)
      else if (req.url === api.routes.read)
        out = await api.handleReadJson(body, ctx)
      else if (req.url === api.routes.mutate)
        out = await api.handleMutateJson(body, ctx)
      else {
        res
          .writeHead(404, { 'content-type': 'application/json' })
          .end(JSON.stringify({ error: 'not found' }))
        return
      }
      res
        .writeHead(200, { 'content-type': 'application/json' })
        .end(JSON.stringify(out))
    } catch (err) {
      const status = err instanceof RindleApiError ? err.status : 500
      const message = err instanceof Error ? err.message : 'internal error'
      res
        .writeHead(status, { 'content-type': 'application/json' })
        .end(JSON.stringify({ error: message }))
    }
  })()
}).listen(PORT, () => {
  console.log(
    `[strut-api] listening on http://127.0.0.1:${PORT} → daemon ${DAEMON_URL}`,
  )
  console.log(
    `[strut-api] routes: ${api.routes.query} | ${api.routes.read} | ${api.routes.mutate}`,
  )
})
