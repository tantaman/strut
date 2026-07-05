// The browser Rindle client (optimistic store + named mutators + live WS subscription).
//
// SSR-safety: WASM + WebSocket are browser-only, so we DON'T create the client at module load and we
// dynamic-import `@rindle/optimistic` (which pulls in @rindle/wasm) only when first asked — i.e. in
// the browser, from RindleProvider's effect. `getApp()` memoizes the promise.

import { mutators, schema } from '../../shared/app-def.ts'
import { currentUser } from './user.ts'

// The live-query WebSocket URL. Resolved at RUNTIME from the server (/api/rindle/config, backed by the
// RINDLE_DAEMON_WS host env var) so a single production build can target any daemon host — no rebuild
// per environment. Falls back to a build-time override (VITE_RINDLE_WS, handy for local dev) and then
// the local daemon default.
async function resolveWsUrl(): Promise<string> {
  try {
    const res = await fetch('/api/rindle/config')
    if (res.ok) {
      const { wsUrl } = (await res.json()) as { wsUrl?: string }
      if (wsUrl) return wsUrl
    }
  } catch {
    // network/parse error — fall through to the build-time / local defaults
  }
  return import.meta.env.VITE_RINDLE_WS ?? 'ws://127.0.0.1:7601'
}

async function create() {
  const [{ createRindleClient }, { initWasm }, wsUrl] = await Promise.all([
    import('@rindle/optimistic'),
    import('@rindle/wasm'),
    resolveWsUrl(),
  ])
  await initWasm()
  const app = await createRindleClient({
    schema,
    mutators,
    api: {
      // NOTE: request url = api.url + routes.query, and routes.query defaults to the ABSOLUTE
      // "/api/rindle/query". So url MUST be "" here (not "/api", which double-prefixes). See
      // RINDLE_NOTES.md #2.
      url: '',
      headers: () => ({ 'x-user': currentUser() }),
    },
    daemon: {
      wsUrl,
    },
    onRejected: (envelope, reason) =>
      console.error(`[rindle] ${envelope.name} rejected:`, reason),
  })

  if (import.meta.env.DEV) {
    void import('@rindle/react-devtools')
      .then(({ attachDevtools }) => attachDevtools(app))
      .catch((e) => console.error('[rindle] failed to load devtools:', e))
  }

  return app
}

export type StrutApp = Awaited<ReturnType<typeof create>>

let _app: Promise<StrutApp> | null = null

export function getApp(): Promise<StrutApp> {
  return (_app ??= create())
}
