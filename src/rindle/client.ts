// The browser Rindle client (optimistic store + named mutators + live WS subscription).
//
// SSR-safety: WASM + WebSocket are browser-only, so we DON'T create the client at module load and we
// dynamic-import `@rindle/optimistic` (which pulls in @rindle/wasm) only when first asked — i.e. in
// the browser, from RindleProvider's effect. `getApp()` memoizes the promise.

import { mutators, schema } from '../../shared/app-def.ts'
import { currentUser } from './user.ts'

async function create() {
  const [{ createRindleClient }, { initWasm }] = await Promise.all([
    import('@rindle/optimistic'),
    import('@rindle/wasm'),
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
      wsUrl: import.meta.env.VITE_RINDLE_WS ?? 'ws://127.0.0.1:7601',
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
