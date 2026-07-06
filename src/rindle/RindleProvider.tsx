// Boots the Rindle client in the browser and provides both the @rindle/react store (for useQuery) and
// the live app (for `app.mutate.*`).
//
// SSR handoff: the live client is browser-only (WASM + WebSocket), so on the server it never boots.
// EVERY route now renders through `<RindleSSR>` (from @rindle/react): it renders children against a
// synchronous, WASM-free seed store on the server AND the client's first paint, boots the live client
// after hydration, re-seeds it (no flash), and swaps the store under the provider with no `useQuery`
// change. A route that PRELOADS a first-paint snapshot in its loader (src/rindle/appSsr.ts for the
// dashboard/editor, shareSsr.ts for the public viewer) exposes it as `loaderData.rindle` and first-
// paints with real content; a route that preloads nothing renders against an EMPTY seed store (a stable
// shell) rather than a blocking "Connecting…" splash — either way there is no full-page splash→content
// swap (the old flicker). Mutations are safe before boot completes: useMutate() returns a deferring
// proxy until the live app lands (see `deferredMutate`).

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { RindleSSR } from '@rindle/react'
import type { DehydratedState } from '@rindle/client'
import { useMatches } from '@tanstack/react-router'
import { schema } from '../../shared/app-def.ts'
import { getApp } from './client.ts'
import type { StrutApp } from './client.ts'

const AppContext = createContext<StrutApp | null>(null)

type RindleDevtoolsComponent = (props: { defaultOpen?: boolean }) => ReactNode

/** The dehydrated Rindle snapshot (a JSON string) a matched route preloaded in its loader, if any. */
function useRindleSeed(): string | null {
  const matches = useMatches()
  for (let i = matches.length - 1; i >= 0; i--) {
    const raw = (matches[i].loaderData as { rindle?: string } | undefined)
      ?.rindle
    if (raw) return raw
  }
  return null
}

// Until the live client boots, mutations defer to it (getApp() is memoized, so post-boot it resolves on
// the next microtask — but by then useMutate returns the REAL app.mutate below, so this only covers the
// brief pre-hydration gap). No mutator's return value is consumed anywhere in the app, so deferring is
// invisible; this just guarantees an early handler never throws on a null app.
const deferredMutate = new Proxy({} as StrutApp['mutate'], {
  get(_target, name) {
    if (typeof name !== 'string') return undefined
    return (args: unknown) => {
      void getApp().then((a) => {
        const fn = (
          a.mutate as Record<string, ((a: unknown) => unknown) | undefined>
        )[name]
        if (fn) fn(args)
      })
    }
  },
})

/** The live app, or `null` before the browser client boots. Consumers that only touch it inside event
 *  handlers (which fire post-boot) can treat it as present; guard the null for anything render-time. */
export function useApp(): StrutApp | null {
  return useContext(AppContext)
}

/** `app.mutate` — the named mutator facade. Returns the live facade once booted (synchronous, full
 *  optimistic behavior), and a deferring proxy in the meantime so early calls never throw. */
export function useMutate(): StrutApp['mutate'] {
  const app = useContext(AppContext)
  return app ? app.mutate : deferredMutate
}

export function RindleProvider({ children }: { children: ReactNode }) {
  const [app, setApp] = useState<StrutApp | null>(null)
  const [error, setError] = useState<string | null>(null)

  const seed = useRindleSeed()
  // The first-paint seed for THIS route (parsed), or an empty snapshot when the route preloaded nothing
  // — RindleSSR renders a stable (empty) shell rather than a splash, and the live client fills it in.
  const ssrState = useMemo<DehydratedState>(() => {
    if (!seed) return {}
    try {
      return JSON.parse(seed) as DehydratedState
    } catch {
      return {}
    }
  }, [seed])

  // Boot the live client and expose it via context (for useApp/useMutate). getApp() is memoized and
  // shared with RindleSSR's own boot(), so the engine is constructed exactly once.
  useEffect(() => {
    let live = true
    getApp()
      .then((a) => live && setApp(a))
      .catch(
        (e) => live && setError(e instanceof Error ? e.message : String(e)),
      )
    return () => {
      live = false
    }
  }, [])

  if (error)
    return (
      <div className="strut-boot strut-boot--error">
        <p>Couldn’t connect to Rindle.</p>
        <pre>{error}</pre>
        <p className="strut-boot__hint">
          Is <code>pnpm dev</code> or <code>pnpm daemon</code> running?
        </p>
      </div>
    )

  return (
    <AppContext.Provider value={app}>
      <RindleSSR schema={schema} ssrState={ssrState} boot={getApp}>
        {children}
        {import.meta.env.DEV ? <RindleDevtoolsMount /> : null}
      </RindleSSR>
    </AppContext.Provider>
  )
}

function RindleDevtoolsMount() {
  const [Devtools, setDevtools] = useState<RindleDevtoolsComponent | null>(null)

  useEffect(() => {
    if (!import.meta.env.DEV) return

    let live = true
    void import('@rindle/react-devtools')
      .then(({ RindleDevtools }) => {
        if (live) setDevtools(() => RindleDevtools)
      })
      .catch((e) => console.error('[rindle] failed to load devtools:', e))

    return () => {
      live = false
    }
  }, [])

  if (!Devtools) return null
  return <Devtools />
}
