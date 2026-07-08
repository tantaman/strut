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
    const auth = await getAuth(request)
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

/** The account fields the dashboard's account control first-paints with. Plain primitives so it rides
 *  the server-fn loader boundary as-is (no JSON-string dance like the rindle rows need). */
export interface SessionAccount {
  id: string
  /** Guest sessions (better-auth's anonymous plugin) show "Sign in"; members show their identity. */
  isAnonymous: boolean
  name: string
  email: string
}

/** Like {@link resolveSessionUser} but returns the display fields too, or null when there is no valid
 *  session. Used to SEED AccountControl's first paint from the SAME cookie the decks seed reads, so the
 *  sign-in pill renders its final label server-side instead of popping in after the client's
 *  useSession() resolves (the counterpart to seeding `canEdit` for the read-only banner). */
export async function resolveSessionAccount(
  request: Request,
): Promise<SessionAccount | null> {
  try {
    const auth = await getAuth(request)
    const session = await auth.api.getSession({ headers: request.headers })
    const user = session?.user
    if (!user) return null
    return {
      id: user.id,
      isAnonymous: (user as { isAnonymous?: boolean }).isAnonymous === true,
      name: user.name,
      email: user.email,
    }
  } catch (err) {
    console.error(
      '[auth] session account resolution failed:',
      err instanceof Error ? err.message : err,
    )
    return null
  }
}
