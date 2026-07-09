import { createFileRoute } from '@tanstack/react-router'

// Better-Auth HTTP endpoints under /api/auth/* (or /app/api/auth/* when mounted under /app) — sign-in,
// OAuth callbacks, session, sign-out. Server-only: the auth + D1 imports are
// dynamically imported inside the handler so they never enter the client bundle (same pattern as
// api.rindle.query.tsx). One fresh auth instance per request — see server/auth.ts.
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { getAuth } = await import('../../server/auth')
        return (await getAuth(request)).handler(request)
      },
      POST: async ({ request }) => {
        const { getAuth } = await import('../../server/auth')
        return (await getAuth(request)).handler(request)
      },
    },
  },
})
