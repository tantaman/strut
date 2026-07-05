import { createAuthClient } from 'better-auth/react'

// Browser-side Better-Auth client. Same-origin: the app and /api/auth/* are served by the same Worker,
// so no baseURL is needed. Use authClient.signIn.social({ provider }), authClient.useSession(),
// authClient.signOut(). See src/routes/signin.tsx and AUTH_PLAN.md.
export const authClient = createAuthClient()
