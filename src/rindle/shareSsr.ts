// SSR for the public /share viewer (SSR-DESIGN.md §6). Thanks to the composed `publicDeckDetail`
// fragment query, seeding a whole deck's first paint is ONE preload: the loader runs this server
// function, which materializes the deck subtree once through the same gated authority path as the
// live subscription and returns a dehydrated snapshot to embed in the HTML. The browser hydrates the
// snapshot for an instant first paint, then the live (WASM + WebSocket) client takes over.
//
// Everything that touches the daemon / server store is dynamically imported INSIDE the handler, which
// `createServerFn` strips from the client bundle — so no daemon or server-only code leaks to the
// browser (and the SSR path stays WASM-free: createServerStore runs over a no-op one-shot backend).

import { createServerFn } from '@tanstack/react-start'

// Returns the dehydrated snapshot as a JSON STRING (TanStack's server-fn serializer can't prove the
// snapshot's `unknown[]` rows are serializable; a string sidesteps that). RindleProvider parses it.
export const preloadShareDeck = createServerFn({ method: 'GET' })
  .validator((input: { deckId: string; token: string }) => input)
  .handler(async ({ data }): Promise<string | null> => {
    if (!data.token) return null
    const [
      { createServerStore },
      { readNamedQuery },
      { schema },
      { publicDeckDetailQuery },
    ] = await Promise.all([
      import('@rindle/client'),
      import('../../server/rindle-api'),
      import('../../shared/app-def'),
      import('../../shared/queries'),
    ])

    const store = createServerStore(schema, {
      query: async ({ name, args }) => {
        const { rows, cvMin } = await readNamedQuery(
          name ?? 'publicDeckDetail',
          args,
          'ssr',
        )
        return { rows: rows as never, cvMin }
      },
    })

    try {
      await store.preload(
        publicDeckDetailQuery({ deckId: data.deckId, token: data.token }),
      )
      return JSON.stringify(store.dehydrate())
    } catch {
      // A bad/missing token or an unreachable daemon just means no SSR seed — the client falls back
      // to the live query (its existing "Loading shared deck…" path), so SSR is best-effort.
      return null
    }
  })
