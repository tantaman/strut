import { createFileRoute } from '@tanstack/react-router'
import { authClient } from '../rindle/authClient'

// Minimal sign-in surface for the auth spike (AUTH_PLAN.md Phase 1–2). Deliberately unstyled beyond a
// few utilities — the real UI comes later. Renders the current session when signed in.
export const Route = createFileRoute('/signin')({
  component: SignIn,
})

function SignIn() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) return <main className="p-8">Loading…</main>

  if (session) {
    return (
      <main className="flex flex-col items-start gap-3 p-8">
        <p>Signed in as {session.user.email || session.user.name}</p>
        <button
          className="rounded border px-3 py-1"
          onClick={() => authClient.signOut()}
        >
          Sign out
        </button>
      </main>
    )
  }

  return (
    <main className="flex flex-col items-start gap-3 p-8">
      <h1 className="text-xl font-semibold">Sign in to Strut</h1>
      <button
        className="rounded border px-3 py-1"
        onClick={() =>
          authClient.signIn.social({ provider: 'github', callbackURL: '/' })
        }
      >
        Continue with GitHub
      </button>
      <button
        className="rounded border px-3 py-1"
        onClick={() =>
          authClient.signIn.social({ provider: 'google', callbackURL: '/' })
        }
      >
        Continue with Google
      </button>
    </main>
  )
}
