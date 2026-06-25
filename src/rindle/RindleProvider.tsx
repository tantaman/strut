// Boots the Rindle client in the browser, then provides both the @rindle/react store (for useQuery)
// and the app itself (for `app.mutate.*`). Renders a loading state until connected.
//
// SSR: the live client is browser-only (WASM + WebSocket), so on the server it never boots. But a
// route may PRELOAD a dehydrated first-paint snapshot in its loader (see src/rindle/shareSsr.ts) and
// expose it as `loaderData.rindle`. When present, we render children against a synchronous, WASM-free
// hydration store (a `createServerStore` over a no-op backend) — so the deck renders in the SSR HTML
// and the client's first paint matches it — then hand off to the live client once it connects (and
// hydrate the live store with the same snapshot so the handoff doesn't flash). Routes that preload
// nothing (editor, dashboard) keep the old behavior: "Connecting…" on the server, live client on boot.

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Rindle } from '@rindle/react'
import { createServerStore } from '@rindle/client'
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

export function useApp(): StrutApp {
  const app = useContext(AppContext)
  if (!app) throw new Error('useApp() used outside <RindleProvider>')
  return app
}

/** `app.mutate` — the named mutator facade. */
export function useMutate(): StrutApp['mutate'] {
  return useApp().mutate
}

export function RindleProvider({ children }: { children: ReactNode }) {
  const [app, setApp] = useState<StrutApp | null>(null)
  const [error, setError] = useState<string | null>(null)

  const seed = useRindleSeed()
  const dehydrated = useMemo<DehydratedState | null>(() => {
    if (!seed) return null
    try {
      return JSON.parse(seed) as DehydratedState
    } catch {
      return null
    }
  }, [seed])

  // A synchronous, WASM-free store seeded from the SSR snapshot — used for the server render and the
  // client's first paint, before the live client connects. `query` is never called (every preloaded
  // view has a seed); it's only there to satisfy the one-shot store contract.
  const hydrationStore = useMemo(() => {
    if (!dehydrated) return null
    const ss = createServerStore(schema, { query: async () => ({ rows: [] }) })
    ss.store.hydrate(dehydrated)
    return ss.store
  }, [dehydrated])

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

  // Once the live client is up, seed it with any SSR snapshot so the handoff from the hydration store
  // doesn't blank out before the first WS reconcile. Best-effort — never let it break the boot.
  useEffect(() => {
    if (!app || !dehydrated) return
    try {
      app.store.hydrate(dehydrated)
    } catch (e) {
      console.error('[rindle] failed to hydrate live store from SSR seed:', e)
    }
  }, [app, dehydrated])

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

  // Live client ready → it's the source of truth for every route.
  if (app)
    return (
      <AppContext.Provider value={app}>
        <Rindle store={app.store}>
          {children}
          {import.meta.env.DEV ? <RindleDevtoolsMount /> : null}
        </Rindle>
      </AppContext.Provider>
    )

  // Not booted yet, but this route preloaded an SSR snapshot → render it (read-only; no AppContext, so
  // mutators aren't available — the preloaded routes are viewers).
  if (hydrationStore) return <Rindle store={hydrationStore}>{children}</Rindle>

  return <div className="strut-boot">Connecting…</div>
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
