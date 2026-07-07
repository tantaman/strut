// Custom Worker entry (wrangler.jsonc `main`). Delegates to TanStack Start's default request handler —
// EXCEPT on the runnable-artifact sandbox origin (ARTIFACT_ORIGIN, e.g. https://sandbox.strut.io), where
// ONLY the artifact routes (`/a/<key>`) are served and everything else 404s. That keeps strut.io as the
// single canonical app origin and makes sandbox.strut.io a bare artifact host — so the app (decks, auth,
// API) is never reachable on the untrusted-code origin. On the apex/app host this is a pass-through.
//
// ARTIFACT_ORIGIN is a wrangler `var`, mirrored onto process.env by nodejs_compat (same as the rest of the
// server config). When it's unset (dev, or same-origin serving), there's no sandbox host and every request
// passes straight through.

import defaultEntry, { type ServerEntry } from '@tanstack/react-start/server-entry'

/** The host component of ARTIFACT_ORIGIN (e.g. "sandbox.strut.io"), or '' when unset/invalid. */
function sandboxHost(): string {
  const origin = process.env.ARTIFACT_ORIGIN
  if (!origin) return ''
  try {
    return new URL(origin).host
  } catch {
    return ''
  }
}

const forward = defaultEntry.fetch as (
  request: Request,
  ...rest: unknown[]
) => Promise<Response>

const entry: ServerEntry = {
  fetch: ((request: Request, ...rest: unknown[]) => {
    const url = new URL(request.url)
    const host = sandboxHost()
    if (host && url.host === host && !url.pathname.startsWith('/a/')) {
      return new Response('Not found', { status: 404 })
    }
    return forward(request, ...rest)
  }) as ServerEntry['fetch'],
}

export default entry
