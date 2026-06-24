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
import { allQueries } from '../shared/queries.ts'
import { isComponentTable } from '../shared/app-def.ts'
import type {
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
  RemoveComponentArgs,
  RenameDeckArgs,
  ReorderSlideArgs,
  SetComponentClassesArgs,
  SetComponentZArgs,
  SetDeckThemeArgs,
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

function update(
  tx: SqlMutationTx,
  table: string,
  id: string,
  row: Record<string, WireValue>,
) {
  const cols = Object.keys(row)
  if (cols.length === 0) return
  tx.exec(
    `UPDATE ${table} SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
    [...cols.map((c) => row[c]), id],
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

  renameDeck: (tx, a: RenameDeckArgs) =>
    update(tx, 'deck', a.id, { title: a.title, modified: a.now }),

  touchDeck: (tx, a: TouchDeckArgs) =>
    update(tx, 'deck', a.id, { modified: a.now }),

  deleteDeck: (tx, a: DeleteDeckArgs) => {
    for (const t of COMPONENT_TABLES)
      tx.exec(
        `DELETE FROM ${t} WHERE slide_id IN (SELECT id FROM slide WHERE deck_id = ?)`,
        [a.id],
      )
    tx.exec('DELETE FROM custom_background WHERE deck_id = ?', [a.id])
    tx.exec('DELETE FROM slide WHERE deck_id = ?', [a.id])
    tx.exec('DELETE FROM deck WHERE id = ?', [a.id])
  },

  setDeckTheme: (tx, a: SetDeckThemeArgs) => {
    const row: Record<string, WireValue> = { modified: a.now }
    if (a.background !== undefined) row.background = a.background
    if (a.surface !== undefined) row.surface = a.surface
    if (a.custom_stylesheet !== undefined)
      row.custom_stylesheet = a.custom_stylesheet
    if (a.chosen_presenter !== undefined)
      row.chosen_presenter = a.chosen_presenter
    if (a.canned_transition !== undefined)
      row.canned_transition = a.canned_transition
    update(tx, 'deck', a.id, row)
  },

  addSlide: (tx, a: AddSlideArgs) =>
    insert(tx, 'slide', {
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

  // Authoritative cascade by slide_id (more robust than trusting the client's id lists).
  deleteSlide: (tx, a: DeleteSlideArgs) => {
    for (const t of COMPONENT_TABLES)
      tx.exec(`DELETE FROM ${t} WHERE slide_id = ?`, [a.id])
    tx.exec('DELETE FROM slide WHERE id = ?', [a.id])
  },

  reorderSlide: (tx, a: ReorderSlideArgs) =>
    update(tx, 'slide', a.id, { sort: a.sort }),

  setSlideTransform: (tx, a: SetSlideTransformArgs) =>
    update(tx, 'slide', a.id, {
      x: a.x,
      y: a.y,
      z: a.z,
      rotate_x: a.rotate_x,
      rotate_y: a.rotate_y,
      rotate_z: a.rotate_z,
      imp_scale: a.imp_scale,
      modified: a.now,
    }),

  setSlideTheme: (tx, a: SetSlideThemeArgs) => {
    const row: Record<string, WireValue> = { modified: a.now }
    if (a.background !== undefined) row.background = a.background
    if (a.surface !== undefined) row.surface = a.surface
    update(tx, 'slide', a.id, row)
  },

  addText: (tx, a: AddTextArgs) =>
    insert(tx, 'text_component', {
      id: a.id,
      ...spatialBase(a),
      text: a.text,
      size: a.size,
      color: a.color,
      font_family: a.font_family,
    }),

  addImage: (tx, a: AddImageArgs) =>
    insert(tx, 'image_component', {
      id: a.id,
      ...spatialBase(a),
      scale_w: a.scale_w,
      scale_h: a.scale_h,
      src: a.src,
      image_type: a.image_type,
    }),

  addShape: (tx, a: AddShapeArgs) =>
    insert(tx, 'shape_component', {
      id: a.id,
      ...spatialBase(a),
      shape: a.shape,
      markup: a.markup,
      fill: a.fill,
    }),

  addVideo: (tx, a: AddVideoArgs) =>
    insert(tx, 'video_component', {
      id: a.id,
      ...spatialBase(a),
      src: a.src,
      video_type: a.video_type,
      src_type: a.src_type,
      short_src: a.short_src,
    }),

  addWebframe: (tx, a: AddWebframeArgs) =>
    insert(tx, 'webframe_component', {
      id: a.id,
      ...spatialBase(a),
      src: a.src,
    }),

  moveComponent: (tx, a: MoveComponentArgs) =>
    update(tx, compTable(a.table), a.id, { x: a.x, y: a.y }),

  transformComponent: (tx, a: TransformComponentArgs) =>
    update(tx, compTable(a.table), a.id, {
      scale_x: a.scale_x,
      scale_y: a.scale_y,
      scale_w: a.scale_w,
      scale_h: a.scale_h,
      rotate: a.rotate,
      skew_x: a.skew_x,
      skew_y: a.skew_y,
    }),

  setComponentZ: (tx, a: SetComponentZArgs) =>
    update(tx, compTable(a.table), a.id, { z_order: a.z_order }),

  setComponentClasses: (tx, a: SetComponentClassesArgs) =>
    update(tx, compTable(a.table), a.id, { custom_classes: a.custom_classes }),

  removeComponent: (tx, a: RemoveComponentArgs) =>
    tx.exec(`DELETE FROM ${compTable(a.table)} WHERE id = ?`, [a.id]),

  setText: (tx, a: SetTextArgs) =>
    update(tx, 'text_component', a.id, {
      text: a.text,
      size: a.size,
      color: a.color,
      font_family: a.font_family,
    }),

  setShapeFill: (tx, a: SetShapeFillArgs) =>
    update(tx, 'shape_component', a.id, { fill: a.fill }),

  mintCustomColor: (tx, a: MintCustomColorArgs) =>
    insert(tx, 'custom_background', {
      id: a.id,
      deck_id: a.deckId,
      klass: a.klass,
      style: a.style,
    }),
})

// ---- server wiring ------------------------------------------------------------------------------

const api = createRindleApiServer<User>({
  daemon: new HttpRindleDaemonClient({
    baseUrl: DAEMON_URL,
    headers: {
      authorization: `Bearer ${process.env.RINDLE_DAEMON_TOKEN ?? ''}`,
    },
  }),
  queries: registerQueries<User>(allQueries),
  mutators,
  // Single-user/local for now: any non-empty user id is allowed. Real auth/ownership is future work.
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
