import { createAuthClient } from 'better-auth/react'
import { anonymousClient } from 'better-auth/client/plugins'
import { appPath } from '../../shared/appPath'

// Browser-side Better-Auth client. Same-origin: the app and /api/auth/* are served by the same Worker,
// so no baseURL is needed. `basePath` follows the app mount path (`/app/api/auth` in commercial builds).
// Use authClient.signIn.anonymous() (guest), authClient.signIn.social({
// provider }) (promote), authClient.useSession(), authClient.signOut(). The anonymousClient plugin
// mirrors the server's anonymous() plugin (server/auth.ts) — it adds signIn.anonymous(). See
// src/rindle/client.ts (boot ensures a session), src/routes/signin.tsx, and AUTH_PLAN.md.
export const authClient = createAuthClient({
  basePath: appPath('/api/auth'),
  plugins: [anonymousClient()],
})
