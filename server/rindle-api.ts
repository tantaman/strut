// Strut's Rindle API — stateless: validates args, runs AUTHORITATIVE writes against the daemon, and
// registers the named queries. Mutators are ISOMORPHIC (shared/app-def.ts): `sharedApiMutators`
// auto-drives the SAME body the client predicts, parsing untrusted wire args and injecting the
// AUTHENTICATED principal. The ONLY explicit entries are the server-only AUTHORITY the client must not
// predict — strut's row-level ACCESS GUARDS:
//   - Most guards are READ-then-throw wrappers: read whether the acting principal may edit the target
//     (owner OR editor-collaborator of the owning deck) via `tx.query` INSIDE the mutation txn, and
//     throw `forbidden` if not — a hard reject the client's optimistic write snaps back from. The
//     shared body stays read-free, so `.folded` hot paths (drag/keystroke) keep folding (the read is
//     server-side only). Reads run through @rindle/query-compiler's sqlite dialect on the daemon.
//   - The two multi-table cascades (deleteDeck / deleteSlide) can't be keyed ops, so they keep the raw
//     `tx.exec` escape hatch with the gate IN the SQL (accepted-but-no-op for a non-owner/-editor).
//
// Hosted by the TanStack Start server routes in src/routes/api.rindle.* (they import handleRindleJson).
// The daemon control plane is :7600 (RINDLE_DAEMON_URL).

import {
  createRindleApiServer,
  defineApiMutators,
  registerQueries,
  runSharedMutation,
  sharedApiMutators,
  RindleApiError,
} from '@rindle/api-server'
import type {
  ApiMutator,
  ApiMutators,
  MutationContext,
  MutatorCtx,
  ServerMutationTx,
  SharedMutatorWithArgs,
} from '@rindle/api-server'
import { HttpRindleDaemonClient } from '@rindle/daemon-client'
import { and, exists, or } from '@rindle/client'
import { serverQueries } from './queries.ts'
import {
  q,
  rels,
  deck,
  deck_share,
  schema,
  mutators as sharedMutators,
  deleteDeckArgs,
  deleteSlideArgs,
} from '../shared/app-def.ts'

export type User = string
type ServerCtx = MutationContext<User>
const DAEMON_URL = process.env.RINDLE_DAEMON_URL ?? 'http://127.0.0.1:7600'

// ---- principal + access predicates --------------------------------------------------------------

function requireUser(user: User): string {
  if (typeof user !== 'string' || user.length === 0) {
    throw new RindleApiError('forbidden', 'a user is required', 403)
  }
  return user
}

/** The MutatorCtx a shared body sees on the server: the AUTHENTICATED principal. */
function sharedCtx(ctx: ServerCtx): MutatorCtx {
  return { user: requireUser(ctx.user) }
}

/** Condition on a DECK row: the principal OWNS it OR is an 'editor' collaborator. */
function deckEditableBy(user: string) {
  return or(
    deck.owner_id(user),
    exists(rels.deckShares, (s) =>
      s.where(and(deck_share.user_id(user), deck_share.role('editor'))),
    ),
  )
}

// ---- read-then-throw guard wrappers -------------------------------------------------------------
// Parse the untrusted args, READ whether the principal may write the target, throw `forbidden` (→ the
// client's optimistic write snaps back) if not, else drive the SAME shared body via runSharedMutation.

/** Generic: authorize via a boolean read against the open txn, then run the shared body. */
function guarded<TArgs>(
  gen: SharedMutatorWithArgs<TArgs>,
  authorized: (
    tx: ServerMutationTx,
    a: TArgs,
    user: string,
  ) => Promise<boolean>,
): ApiMutator<User, unknown> {
  return async (tx, raw, ctx) => {
    const a = gen.args.parse(raw)
    const user = requireUser(ctx.user)
    if (!(await authorized(tx, a, user))) {
      throw new RindleApiError(
        'forbidden',
        'not permitted to edit this deck',
        403,
      )
    }
    return runSharedMutation(gen, a, sharedCtx(ctx), tx)
  }
}

/** The target deck (by id) is editable by the principal. */
const withDeckEditable = <TArgs>(
  deckIdOf: (a: TArgs) => string,
  gen: SharedMutatorWithArgs<TArgs>,
) =>
  guarded(gen, async (tx, a, user) => {
    const row = await tx.query(
      q.deck.where.id(deckIdOf(a)).where(deckEditableBy(user)).one(),
    )
    return row != null
  })

/** The target slide's (by id) owning deck is editable by the principal. */
const withSlideEditable = <TArgs>(
  slideIdOf: (a: TArgs) => string,
  gen: SharedMutatorWithArgs<TArgs>,
) =>
  guarded(gen, async (tx, a, user) => {
    const row = await tx.query(
      q.slide.where
        .id(slideIdOf(a))
        .where(exists(rels.slideDeck, (d) => d.where(deckEditableBy(user))))
        .one(),
    )
    return row != null
  })

/** The target component's (by id) owning deck (component → slide → deck) is editable by the principal. */
const withComponentEditable = <TArgs>(
  compIdOf: (a: TArgs) => string,
  gen: SharedMutatorWithArgs<TArgs>,
) =>
  guarded(gen, async (tx, a, user) => {
    const row = await tx.query(
      q.component.where
        .id(compIdOf(a))
        .where(
          exists(rels.componentSlide, (s) =>
            s.where(
              exists(rels.slideDeck, (d) => d.where(deckEditableBy(user))),
            ),
          ),
        )
        .one(),
    )
    return row != null
  })

/** The target deck (by id) is OWNED by the principal (sharing/visibility are owner-only). */
const withDeckOwner = <TArgs>(
  deckIdOf: (a: TArgs) => string,
  gen: SharedMutatorWithArgs<TArgs>,
) =>
  guarded(gen, async (tx, a, user) => {
    const row = await tx.query(
      q.deck.where.id(deckIdOf(a)).where(deck.owner_id(user)).one(),
    )
    return row != null
  })

/** The target deck_share row's (by id) deck is OWNED by the principal (only the owner un-shares). */
const withShareOwner = <TArgs>(
  shareIdOf: (a: TArgs) => string,
  gen: SharedMutatorWithArgs<TArgs>,
) =>
  guarded(gen, async (tx, a, user) => {
    const row = await tx.query(
      q.deck_share.where
        .id(shareIdOf(a))
        .where(exists(rels.shareDeck, (d) => d.where(deck.owner_id(user))))
        .one(),
    )
    return row != null
  })

// ---- authoritative mutator registry -------------------------------------------------------------

const apiMutators = defineApiMutators<User, ApiMutators<User>>({
  // Every shared mutator, auto-driven (parse args → inject the authenticated principal → run the SAME
  // body the client predicts). createDeck / setDisplayName need no override: createDeck writes
  // owner_id = ctx.user (the authenticated principal), and setDisplayName upserts keyed to ctx.user.
  ...sharedApiMutators(sharedMutators, sharedCtx),

  // ---- deck edits: editable (owner or editor) ----
  renameDeck: withDeckEditable((a) => a.id, sharedMutators.renameDeck),
  touchDeck: withDeckEditable((a) => a.id, sharedMutators.touchDeck),
  setDeckTheme: withDeckEditable((a) => a.id, sharedMutators.setDeckTheme),
  mintCustomColor: withDeckEditable(
    (a) => a.deckId,
    sharedMutators.mintCustomColor,
  ),
  addSlide: withDeckEditable((a) => a.deckId, sharedMutators.addSlide),

  // ---- deck admin: owner-only ----
  setDeckVisibility: withDeckOwner(
    (a) => a.id,
    sharedMutators.setDeckVisibility,
  ),
  addCollaborator: withDeckOwner(
    (a) => a.deckId,
    sharedMutators.addCollaborator,
  ),
  removeCollaborator: withShareOwner(
    (a) => a.id,
    sharedMutators.removeCollaborator,
  ),

  // ---- slide edits: the slide's owning deck is editable ----
  reorderSlide: withSlideEditable((a) => a.id, sharedMutators.reorderSlide),
  setSlideTransform: withSlideEditable(
    (a) => a.id,
    sharedMutators.setSlideTransform,
  ),
  setSlideTheme: withSlideEditable((a) => a.id, sharedMutators.setSlideTheme),
  setSlideMarkdown: withSlideEditable(
    (a) => a.id,
    sharedMutators.setSlideMarkdown,
  ),
  setSlideDoc: withSlideEditable((a) => a.id, sharedMutators.setSlideDoc),
  setSlideMode: withSlideEditable((a) => a.id, sharedMutators.setSlideMode),

  // ---- component adds: the target slide is editable ----
  addText: withSlideEditable((a) => a.slideId, sharedMutators.addText),
  addImage: withSlideEditable((a) => a.slideId, sharedMutators.addImage),
  addShape: withSlideEditable((a) => a.slideId, sharedMutators.addShape),
  addVideo: withSlideEditable((a) => a.slideId, sharedMutators.addVideo),
  addWebframe: withSlideEditable((a) => a.slideId, sharedMutators.addWebframe),

  // ---- component edits: the target component is editable ----
  moveComponent: withComponentEditable(
    (a) => a.id,
    sharedMutators.moveComponent,
  ),
  transformComponent: withComponentEditable(
    (a) => a.id,
    sharedMutators.transformComponent,
  ),
  setComponentZ: withComponentEditable(
    (a) => a.id,
    sharedMutators.setComponentZ,
  ),
  setComponentClasses: withComponentEditable(
    (a) => a.id,
    sharedMutators.setComponentClasses,
  ),
  setText: withComponentEditable((a) => a.id, sharedMutators.setText),
  setShapeFill: withComponentEditable((a) => a.id, sharedMutators.setShapeFill),
  removeComponent: withComponentEditable(
    (a) => a.id,
    sharedMutators.removeComponent,
  ),

  // ---- multi-table cascades: raw escape hatch, gate IN the SQL (accepted-but-no-op if unauthorized) ----
  // Owner-gated deck cascade. Order matters: the child deletes read the deck's owner_id, so the deck
  // row is deleted LAST.
  deleteDeck: async (tx: ServerMutationTx, raw: unknown, ctx: ServerCtx) => {
    const { id } = deleteDeckArgs.parse(raw)
    const user = requireUser(ctx.user)
    const owner = 'EXISTS (SELECT 1 FROM deck WHERE id = ? AND owner_id = ?)'
    tx.exec(
      `DELETE FROM component WHERE slide_id IN (SELECT id FROM slide WHERE deck_id = ?) AND ${owner}`,
      [id, id, user],
    )
    tx.exec(`DELETE FROM custom_background WHERE deck_id = ? AND ${owner}`, [
      id,
      id,
      user,
    ])
    tx.exec(`DELETE FROM deck_share WHERE deck_id = ? AND ${owner}`, [
      id,
      id,
      user,
    ])
    tx.exec(`DELETE FROM slide WHERE deck_id = ? AND ${owner}`, [id, id, user])
    tx.exec('DELETE FROM deck WHERE id = ? AND owner_id = ?', [id, user])
  },
  // Editable-gated slide cascade — deletes the slide's components by slide_id (NOT the client-supplied
  // componentIds, which a malicious client could point at another deck), then the slide.
  deleteSlide: async (tx: ServerMutationTx, raw: unknown, ctx: ServerCtx) => {
    const { id } = deleteSlideArgs.parse(raw)
    const user = requireUser(ctx.user)
    const editableSlides =
      "(SELECT id FROM slide WHERE deck_id IN (SELECT id FROM deck WHERE owner_id = ? UNION SELECT deck_id FROM deck_share WHERE user_id = ? AND role = 'editor'))"
    tx.exec(
      `DELETE FROM component WHERE slide_id = ? AND slide_id IN ${editableSlides}`,
      [id, user, user],
    )
    tx.exec(`DELETE FROM slide WHERE id = ? AND id IN ${editableSlides}`, [
      id,
      user,
      user,
    ])
  },
})

// ---- server wiring ------------------------------------------------------------------------------

const api = createRindleApiServer<User>({
  daemon: new HttpRindleDaemonClient({
    baseUrl: DAEMON_URL,
    headers: {
      authorization: `Bearer ${process.env.RINDLE_DAEMON_TOKEN ?? ''}`,
    },
  }),
  // `schema` drives the dialect SQL renderer for the LOGICAL mutator writes (tx.insert/update/…) AND
  // the read-compiler for the access-guard `tx.query` reads.
  schema,
  queries: registerQueries<User>(serverQueries),
  mutators: apiMutators,
  // Coarse gate: require a non-empty principal. Row-level access lives where Rindle gives the tools —
  // queries are owner/share-scoped (server/queries.ts) and mutators are access-guarded (above).
  authorizeQuery: ({ user }) => typeof user === 'string' && user.length > 0,
  authorizeMutation: ({ user }) => typeof user === 'string' && user.length > 0,
})

// Web-standard entrypoint used by the TanStack Start server routes (src/routes/api.rindle.*).
export type RindleRouteKind = 'query' | 'read' | 'mutate'

export async function handleRindleJson(
  kind: RindleRouteKind,
  request: Request,
): Promise<Response> {
  try {
    const body = JSON.parse((await request.text()) || '{}')
    // Principal = the server-verified session (the cookie), NOT the client's `x-user` header. The
    // browser mints an anonymous session on first touch, so a principal is normally always present; a
    // missing/invalid session → '' → the coarse authorize* gates reject.
    const { resolveSessionUser } = await import('./session.ts')
    const ctx = { user: await resolveSessionUser(request), request }
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
    // Surface unexpected failures in `wrangler tail`: we catch here, so the Worker outcome stays "Ok"
    // and a 500 is otherwise invisible in the logs. Skip expected guard rejects (forbidden/400 —
    // routine optimistic-write snap-backs) to avoid noise.
    if (!(err instanceof RindleApiError)) console.error(`[rindle] ${kind} failed:`, err)
    return Response.json({ error: message }, { status })
  }
}

// One-shot SSR read of a named query: the server-side SSR preload (src/rindle/shareSsr.ts) calls this
// to seed a route's first paint through the same authoritative (gated) path as the live subscription.
export async function readNamedQuery(
  name: string,
  args: unknown,
  user: string,
  request?: Request,
): Promise<{ rows: { cols: Record<string, unknown> }[]; cvMin?: number }> {
  const ctx = {
    user,
    request: request ?? new Request('http://localhost/api/rindle/read'),
  }
  const out = await api.handleReadJson({ name, args }, ctx)
  return { rows: out.rows, cvMin: out.cvMin }
}
