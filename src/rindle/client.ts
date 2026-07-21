// The browser Rindle client (optimistic store + named mutators + live WS subscription).
//
// SSR-safety: WASM + WebSocket are browser-only, so we DON'T create the client at module load and we
// dynamic-import `@rindle/optimistic` (which pulls in @rindle/wasm) only when first asked — i.e. in
// the browser, from RindleProvider's effect. `getApp()` memoizes the promise.

import { mutators } from '../../shared/app-def.ts'
import { clientSchema } from './localSchema.ts'
import { authClient } from './authClient.ts'
import { APP_BASEPATH } from '../../shared/appPath.ts'
import wasmUrl from 'rindle-wasm-bin?url'

// The acting principal (the Better-Auth session's user id) the optimistic engine predicts under. It
// MUST match what the server derives from the session cookie (server/session.ts), so the optimistic
// owner_id/author on a predicted row equals the authoritative one — no snap-back. Set once by
// ensureSession() before the client is constructed; re-read per invoke via `user: () => sessionUserId`.
let sessionUserId = ''

/** The current session's user id, or '' before boot. Reactive consumers should use
 *  authClient.useSession() instead; this is the synchronous value the mutator predictions read. */
export function currentUserId(): string {
  return sessionUserId
}

/** Guest-first: ensure this browser has a server session before the engine boots. getSession returns
 *  the existing (anonymous OR promoted) session; only the very first visit mints an anonymous one. The
 *  session cookie then rides same-origin on every /api/rindle/* fetch, so the server can derive the
 *  same principal. */
async function ensureSession(): Promise<string> {
  const existing = await authClient.getSession()
  let user = existing.data?.user
  if (!user) {
    const created = await authClient.signIn.anonymous()
    user = created.data?.user
  }
  sessionUserId = user?.id ?? ''
  if (!sessionUserId)
    console.error(
      '[rindle] no session user id — API reads will be unauthorized',
    )
  return sessionUserId
}

async function create() {
  // Ensure a server session FIRST, so `sessionUserId` is set before the engine predicts anything and
  // the session cookie exists for the API fetches below.
  const [, { createRindleClient }, { initWasm }] = await Promise.all([
    ensureSession(),
    import('@rindle/optimistic'),
    import('@rindle/wasm'),
  ])
  await initWasm(wasmUrl)
  const app = await createRindleClient({
    // The EXTENDED schema — the plain synced `schema` plus the client-only `chat_message` local table
    // (src/rindle/localSchema.ts). Only the browser engine learns the local table; SSR / server keep the
    // plain `schema`. `app.store` is now typed with the extended columns, so `store.query.chat_message`
    // and `store.writeLocal` resolve for the ✨ Chat panel.
    schema: clientSchema,
    mutators,
    // The acting principal for a shared mutator's ctx.user — the local user the optimistic prediction
    // writes under. The API server derives the SAME id from the session cookie for the authoritative
    // run (server/session.ts), so the prediction matches (no snap-back).
    user: () => sessionUserId,
    api: {
      // NOTE: request url = api.url + routes.query, and routes.query defaults to the ABSOLUTE
      // "/api/rindle/query". The app basepath is the only safe prefix here: root builds use "",
      // commercial builds use "/app", yielding "/app/api/rindle/query".
      url: APP_BASEPATH,
      // Identity now rides the session cookie (same-origin), NOT a spoofable header — the server
      // ignores x-user. `credentials: same-origin` is fetch's default; set explicitly so the cookie is
      // guaranteed to be sent even if a future default changes.
      fetch: (input, init) =>
        fetch(input, { ...init, credentials: 'same-origin' }),
    },
    // No daemon config is needed in 0.7.3: the first query lease discovers the fleet WebSocket
    // endpoint and carries the affinity ticket that pins the HTTP and WebSocket legs together.
    dev: { resetOnMutationGap: import.meta.env.DEV },
    onRejected: (envelope, reason) =>
      console.error(`[rindle] ${envelope.name} rejected:`, reason),
  })

  if (import.meta.env.DEV) {
    void import('@rindle/devtools')
      .then(({ attachDevtools }) => attachDevtools(app))
      .catch((e) => console.error('[rindle] failed to load devtools:', e))
  }

  return app
}

export type StrutApp = Awaited<ReturnType<typeof create>>
/** The browser store, typed with the extended (`clientSchema`) columns — so `store.query.chat_message`
 *  and `store.writeLocal(...)` resolve for the ✨ Chat local table. */
export type StrutStore = StrutApp['store']

let _app: Promise<StrutApp> | null = null

export function getApp(): Promise<StrutApp> {
  return (_app ??= create())
}
