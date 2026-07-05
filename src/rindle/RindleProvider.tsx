// Boots the Rindle client in the browser, then provides both the @rindle/react store (for useQuery)
// and the app itself (for `app.mutate.*`).
//
// SSR: the live client is browser-only (WASM + WebSocket), so on the server it never boots. A route
// may PRELOAD a dehydrated first-paint snapshot in its loader (see src/rindle/shareSsr.ts) and expose
// it as `loaderData.rindle`. When present, we hand the whole seed→live handoff to `<RindleSSR>` (from
// @rindle/react): it renders children against a synchronous, WASM-free seed store on the server and
// the client's first paint, boots the live client after hydration, re-seeds it (no flash), and swaps
// the store under the provider with no `useQuery` change. Routes that preload nothing (editor,
// dashboard) are mutation-driven, so they GATE on the live client instead — "Connecting…" until it's
// up — and never render against an empty store.

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Rindle, RindleSSR } from '@rindle/react'
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
    const raw = (matches[i].loaderData as { rindle?: string } | undefined)?.rindle
    if (raw) return raw
  }
  return null
}

export function useApp(): StrutApp {
  const app = useContext(AppContext)
  if (!app) throw new Error('useApp() used outside <RindleProvider> (or before the client booted)')
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
  const ssrState = useMemo<DehydratedState | null>(() => {
    if (!seed) return null
    try {
      return JSON.parse(seed) as DehydratedState
    } catch {
      return null
    }
  }, [seed])

  useEffect(() => {
    let live = true
    getApp()
      .then((a) => live && setApp(a))
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)))
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

  // Seeded route (the /share viewer): first-paint against the SSR snapshot, then RindleSSR boots the
  // live client and swaps the store under the provider with no flash. Read-only — no mutators fire
  // here, so it renders before `app` resolves (AppContext lights up once boot completes).
  if (ssrState) {
    return (
      <AppContext.Provider value={app}>
        <RindleSSR schema={schema} ssrState={ssrState} boot={getApp}>
          {children}
        </RindleSSR>
      </AppContext.Provider>
    )
  }

  // Non-seeded routes are mutation-driven → gate on the live client (useMutate needs a booted app).
  if (app)
    return (
      <AppContext.Provider value={app}>
        <Rindle store={app.store}>
          {children}
          {import.meta.env.DEV ? <RindleDevtoolsMount /> : null}
        </Rindle>
      </AppContext.Provider>
    )

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
