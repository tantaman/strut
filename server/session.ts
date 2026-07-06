// The server trust boundary for identity (AUTH_PLAN Phase 3). Every authoritative request — a rindle
// query/read/mutate (server/rindle-api.ts) and an image upload (server/upload.ts) — derives its
// principal HERE, from the Better-Auth session cookie, and IGNORES any client-supplied `x-user` header
// (which was spoofable). The browser mints an anonymous session on first touch (src/rindle/client.ts),
// so a principal is essentially always present; a missing/invalid session resolves to '' → the coarse
// authorize* gates reject it.

import { getAuth } from './auth.ts'

/** Resolve the acting principal from the request's session cookie, or '' when there is no valid
 *  session. Never throws — a resolution failure is treated as "no principal" (the gates reject). */
export async function resolveSessionUser(request: Request): Promise<string> {
  try {
    const auth = await getAuth()
    const session = await auth.api.getSession({ headers: request.headers })
    return session?.user.id ?? ''
  } catch (err) {
    console.error(
      '[auth] session resolution failed:',
      err instanceof Error ? err.message : err,
    )
    return ''
  }
}
