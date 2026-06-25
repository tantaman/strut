// Boots the Rindle client in the browser, then provides both the @rindle/react store (for useQuery)
// and the app itself (for `app.mutate.*`). Renders a loading state until connected — which also keeps
// SSR happy (the effect never runs on the server, so both tiers first render "Connecting…").

import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Rindle } from '@rindle/react'
import { getApp } from './client.ts'
import type { StrutApp } from './client.ts'

const AppContext = createContext<StrutApp | null>(null)

type RindleDevtoolsComponent = (props: { defaultOpen?: boolean }) => ReactNode

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

  if (!app) return <div className="strut-boot">Connecting…</div>

  return (
    <AppContext.Provider value={app}>
      <Rindle store={app.store}>
        {children}
        {import.meta.env.DEV ? <RindleDevtoolsMount /> : null}
      </Rindle>
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
