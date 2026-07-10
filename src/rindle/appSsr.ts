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
import type { SessionAccount } from '../../server/session'
import type { EntitlementSummary } from '../../shared/commercial'

/** Load the modules the two preloaders share (server-only; dynamic so they never enter the client
 *  bundle) and resolve the current session principal. Returns null when there's no session. */
async function seedContext() {
  const [
    { createServerStore },
    { readNamedQuery },
    { resolveSessionAccount },
    { schema },
    { getRequest },
  ] = await Promise.all([
    import('@rindle/client'),
    import('../../server/rindle-api'),
    import('../../server/session'),
    import('../../shared/app-def'),
    import('@tanstack/react-start/server'),
  ])
  const account = await resolveSessionAccount(getRequest())
  if (!account) return null
  const store = createServerStore(schema, {
    query: async ({ name, args }) => {
      const { rows, cvMin } = await readNamedQuery(name ?? '', args, account.id)
      return { rows: rows as never, cvMin }
    },
  })
  return { store, account }
}

/** What every app preloader returns: the dehydrated first-paint seed (a JSON string, or null when
 *  there's no session / the read failed) plus the resolved session principal — the latter lets a route
 *  compute ownership (canEdit) correctly DURING SSR, before the client-side session hook resolves (so
 *  the editor doesn't flash its read-only banner on first paint). */
export interface AppSeed {
  rindle: string | null
  userId: string
  /** The viewer's account (guest or member), resolved server-side from the session cookie, so the
   *  dashboard's account control first-paints its final label instead of popping in post-hydration.
   *  null when there's no session yet (a brand-new visitor) — the control falls back to its guest
   *  default ("Sign in"), which is what that visitor becomes anyway, so still no flip. */
  account: SessionAccount | null
  /** The viewer's plan summary for the account UI (Pro badge / Upgrade link). null in the editor seed
   *  (no account pill there) and when there's no session. With no commercial overlay this is the
   *  COMMUNITY projection with `upgradeUrl: null`, so no upgrade affordance renders. */
  entitlement: EntitlementSummary | null
  /** Plain server-read discovery results. These intentionally stay OUTSIDE the dehydrated Rindle
   *  store: deck rows are unioned across active coverages, so adding unrelated public rows there
   *  could make the intentionally un-gated client `decksQuery` mistake them for the viewer's decks. */
  recentDecks?: RecentDeckSummary[]
}

export interface RecentDeckSummary {
  id: string
  title: string
  created: number
  share_token: string
  slideCount: number
}

async function readRecentDecks(): Promise<RecentDeckSummary[]> {
  try {
    const [{ readNamedQuery }, { RECENT_DECKS_LIMIT }] = await Promise.all([
      import('../../server/rindle-api'),
      import('../../shared/queries'),
    ])
    const { rows } = await readNamedQuery(
      'recentDecks',
      { limit: RECENT_DECKS_LIMIT },
      'public-discovery',
    )
    return rows.flatMap(({ cols }) => {
      const id = typeof cols.id === 'string' ? cols.id : ''
      const share_token =
        typeof cols.share_token === 'string' ? cols.share_token : ''
      if (!id || !share_token) return []
      return [
        {
          id,
          title: typeof cols.title === 'string' ? cols.title : '',
          created: typeof cols.created === 'number' ? cols.created : 0,
          share_token,
          slideCount: typeof cols.slideCount === 'number' ? cols.slideCount : 0,
        },
      ]
    })
  } catch (err) {
    console.error(
      '[ssr] recent decks read failed:',
      err instanceof Error ? err.message : err,
    )
    return []
  }
}

// Dashboard: the principal's decks (newest first). The server twin (server/queries.ts) scopes `decks`
// to "owned or shared", so the seed only ever carries this viewer's decks.
export const preloadDecks = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AppSeed> => {
    const [recentDecks, ctx] = await Promise.all([
      readRecentDecks(),
      seedContext(),
    ])
    if (!ctx)
      return {
        rindle: null,
        userId: '',
        account: null,
        entitlement: null,
        recentDecks,
      }
    const { decksQuery, DECKS_LIMIT } = await import('../../shared/queries')
    const state = await ctx.store.preloadAll(
      [decksQuery({ limit: DECKS_LIMIT })],
      {
        onError: (_q, err) =>
          console.error(
            '[ssr] decks preload failed; first paint without seed:',
            err instanceof Error ? err.message : err,
          ),
      },
    )
    // Seed the plan summary so the account control first-paints its Pro badge / Upgrade link (no I/O in
    // the open-source build — getEntitlements is the COMMUNITY constant with upgradeUrl null).
    const { getEntitlements, entitlementSummary } =
      await import('../../server/entitlements')
    const entitlement = entitlementSummary(
      await getEntitlements(ctx.account.id),
    )
    return {
      rindle: JSON.stringify(state),
      userId: ctx.account.id,
      account: ctx.account,
      entitlement,
      recentDecks,
    }
  },
)

// Editor: the deck subtree (deckDetail) + its collaborators (deckShares) — the two queries the editor
// opens on first render. Both are access-gated to the principal server-side, so a stranger loading a
// deck they can't see just gets an empty seed (then the live query confirms no access).
export const preloadDeck = createServerFn({ method: 'GET' })
  .validator((input: { deckId: string }) => input)
  .handler(async ({ data }): Promise<AppSeed> => {
    const ctx = await seedContext()
    if (!ctx)
      return { rindle: null, userId: '', account: null, entitlement: null }
    const { deckDetailQuery, deckSharesQuery } =
      await import('../../shared/queries')
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
    const { getEntitlements, entitlementSummary } =
      await import('../../server/entitlements')
    const entitlement = entitlementSummary(
      await getEntitlements(ctx.account.id),
    )
    return {
      rindle: JSON.stringify(state),
      userId: ctx.account.id,
      account: ctx.account,
      entitlement,
    }
  })
