// Custom Worker entry (wrangler.jsonc `main`). Delegates to TanStack Start's default request handler —
// EXCEPT on the runnable-artifact sandbox origin (ARTIFACT_ORIGIN, e.g. https://sandbox.strut.io), where
// ONLY the artifact routes (`/a/<key>`) are served and everything else 404s. When the app is mounted
// under /app, those sandbox requests are internally rewritten to `/app/a/<key>`. That keeps strut.io as
// the single canonical app origin and makes sandbox.strut.io a bare artifact host — so the app (decks,
// auth, API) is never reachable on the untrusted-code origin. On the apex/app host this is a pass-through.
//
// ARTIFACT_ORIGIN is a wrangler `var`, mirrored onto process.env by nodejs_compat (same as the rest of the
// server config). When it's unset (dev, or same-origin serving), there's no sandbox host and every request
// passes straight through.

import defaultEntry from '@tanstack/react-start/server-entry'
import type { ServerEntry } from '@tanstack/react-start/server-entry'
import { commercial } from '#commercial'
import { APP_BASEPATH } from '../shared/appPath.ts'

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

function isSandboxArtifactPath(pathname: string): boolean {
  return (
    pathname.startsWith('/a/') ||
    (!!APP_BASEPATH && pathname.startsWith(`${APP_BASEPATH}/a/`))
  )
}

function withPathname(request: Request, pathname: string): Request {
  const url = new URL(request.url)
  url.pathname = pathname
  return new Request(url.toString(), request)
}

const forward = defaultEntry.fetch as (
  request: Request,
  ...rest: unknown[]
) => Promise<Response>

const entry: ServerEntry = {
  fetch: async (request: Request, ...rest: unknown[]) => {
    const url = new URL(request.url)
    const host = sandboxHost()
    let appRequest = request
    if (host && url.host === host) {
      if (!isSandboxArtifactPath(url.pathname)) {
        return new Response('Not found', { status: 404 })
      }
      if (APP_BASEPATH && url.pathname.startsWith('/a/')) {
        appRequest = withPathname(request, `${APP_BASEPATH}${url.pathname}`)
      }
    }
    // Commercial overlay (private; null in the open-source build). It gets first crack at the marketing
    // pages (apex host) and owns /api/billing/*, deciding by host/path itself; returning null falls
    // through to the app. With no overlay this branch is skipped and every host serves the app as before.
    if (commercial) {
      const handled = await commercial.fetch(appRequest, ...rest)
      if (handled) return handled
    }
    return forward(appRequest, ...rest)
  },
}

export default entry
