// SSR seed for the AUTHENTICATED routes — the dashboard (`/`) and the deck editor (`/deck/:id`). This
// is what makes those routes first-paint with real content instead of the old "Connecting…" splash
// (the flicker). It's the private counterpart to shareSsr.ts (the public token-gated viewer): here the
// principal is the viewer's own session, resolved server-side from the cookie (server/session.ts), so
// the seed is scoped to their decks.
//
// Each loader runs one of these server functions; the handler resolves the session, reads the route's
// first-paint queries ONCE through the same gated authority the live subscription uses, and returns a
// dehydrated snapshot (a JSON string) that RindleProvider hands to <RindleSSR>. Best-effort: no session
// (brand-new visitor before the client mints one) or a daemon blip just returns null → the route falls
// back to the live query after the client boots (no error boundary).
//
// Everything daemon/server-only is dynamically imported INSIDE the handler so createServerFn strips it
// from the client bundle, and the SSR path stays WASM-free (createServerStore runs over a one-shot
// backend). Returns a JSON STRING for the same reason as shareSsr: the server-fn serializer can't prove
// the snapshot's `unknown[]` rows are serializable.

import { createServerFn } from '@tanstack/react-start'

/** Load the modules the two preloaders share (server-only; dynamic so they never enter the client
 *  bundle) and resolve the current session principal. Returns null when there's no session. */
async function seedContext() {
  const [
    { createServerStore },
    { readNamedQuery },
    { resolveSessionUser },
    { schema },
    { getRequest },
  ] = await Promise.all([
    import('@rindle/client'),
    import('../../server/rindle-api'),
    import('../../server/session'),
    import('../../shared/app-def'),
    import('@tanstack/react-start/server'),
  ])
  const user = await resolveSessionUser(getRequest())
  if (!user) return null
  const store = createServerStore(schema, {
    query: async ({ name, args }) => {
      const { rows, cvMin } = await readNamedQuery(name ?? '', args, user)
      return { rows: rows as never, cvMin }
    },
  })
  return { store, user }
}

/** What every app preloader returns: the dehydrated first-paint seed (a JSON string, or null when
 *  there's no session / the read failed) plus the resolved session principal — the latter lets a route
 *  compute ownership (canEdit) correctly DURING SSR, before the client-side session hook resolves (so
 *  the editor doesn't flash its read-only banner on first paint). */
export interface AppSeed {
  rindle: string | null
  userId: string
}

// Dashboard: the principal's decks (newest first). The server twin (server/queries.ts) scopes `decks`
// to "owned or shared", so the seed only ever carries this viewer's decks.
export const preloadDecks = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AppSeed> => {
    const ctx = await seedContext()
    if (!ctx) return { rindle: null, userId: '' }
    const { decksQuery } = await import('../../shared/queries')
    const state = await ctx.store.preloadAll([decksQuery({ limit: 200 })], {
      onError: (_q, err) =>
        console.error(
          '[ssr] decks preload failed; first paint without seed:',
          err instanceof Error ? err.message : err,
        ),
    })
    return { rindle: JSON.stringify(state), userId: ctx.user }
  },
)

// Editor: the deck subtree (deckDetail) + its collaborators (deckShares) — the two queries the editor
// opens on first render. Both are access-gated to the principal server-side, so a stranger loading a
// deck they can't see just gets an empty seed (then the live query confirms no access).
export const preloadDeck = createServerFn({ method: 'GET' })
  .validator((input: { deckId: string }) => input)
  .handler(async ({ data }): Promise<AppSeed> => {
    const ctx = await seedContext()
    if (!ctx) return { rindle: null, userId: '' }
    const { deckDetailQuery, deckSharesQuery } = await import(
      '../../shared/queries'
    )
    const state = await ctx.store.preloadAll(
      [
        deckDetailQuery({ deckId: data.deckId }),
        deckSharesQuery({ deckId: data.deckId }),
      ],
      {
        onError: (_q, err) =>
          console.error(
            '[ssr] deck preload failed; first paint without seed:',
            err instanceof Error ? err.message : err,
          ),
      },
    )
    return { rindle: JSON.stringify(state), userId: ctx.user }
  })
