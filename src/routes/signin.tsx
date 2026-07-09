import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { authClient } from '../rindle/authClient'
import { appPath } from '../../shared/appPath'

// Sign-in surface. Two ways in:
//   • Directly (guest-first: a visitor usually already holds an ANONYMOUS session here — that is NOT a
//     member, so we still offer the provider buttons; promoting carries their decks over).
//   • From the marketing "Get Pro" modal's fallback, as /signin?next=upgrade&provider=github — in which
//     case we start OAuth immediately and, on return, route to checkout instead of the app root.
// The commercial overlay owns /api/billing/checkout; appPath() prefixes the app mount (/app in overlay
// builds), matching the worker's billing route. In the open-source build there's no upgrade path here.
type SigninSearch = { next?: 'upgrade'; provider?: 'github' | 'google' }

export const Route = createFileRoute('/signin')({
  validateSearch: (search: Record<string, unknown>): SigninSearch => ({
    next: search.next === 'upgrade' ? 'upgrade' : undefined,
    provider:
      search.provider === 'github' || search.provider === 'google'
        ? search.provider
        : undefined,
  }),
  component: SignIn,
})

function SignIn() {
  const { next, provider } = Route.useSearch()
  const { data: session, isPending } = authClient.useSession()
  const [busy, setBusy] = useState(false)

  const user = session?.user as
    | { isAnonymous?: boolean; email?: string; name?: string }
    | undefined
  // The anonymous plugin flags guest sessions; a guest is not yet a member, so they still see sign-in.
  const isMember = !!user && user.isAnonymous !== true
  const callbackURL =
    next === 'upgrade' ? appPath('/api/billing/checkout') : appPath('/')

  function go(p: 'github' | 'google') {
    setBusy(true)
    void authClient.signIn.social({ provider: p, callbackURL })
  }

  // A member who came here to upgrade shouldn't hit a sign-in wall — send them on to checkout. And a
  // deep-linked provider (marketing modal fallback) starts OAuth on its own.
  useEffect(() => {
    if (isPending || busy) return
    if (isMember && next === 'upgrade') {
      window.location.assign(callbackURL)
    } else if (!isMember && provider) {
      go(provider)
    }
  }, [isPending, busy, isMember, next, provider])

  if (isPending) return <main className="p-8">Loading…</main>

  if (isMember) {
    if (next === 'upgrade')
      return <main className="p-8">Taking you to checkout…</main>
    return (
      <main className="flex flex-col items-start gap-3 p-8">
        <p>Signed in as {user.email || user.name}</p>
        <button
          className="rounded border px-3 py-1"
          onClick={() => authClient.signOut()}
        >
          Sign out
        </button>
      </main>
    )
  }

  if (provider || busy)
    return <main className="p-8">Redirecting to sign-in…</main>

  return (
    <main className="flex flex-col items-start gap-3 p-8">
      <h1 className="text-xl font-semibold">
        {next === 'upgrade' ? 'Sign in to go Pro' : 'Sign in to Strut'}
      </h1>
      <button className="rounded border px-3 py-1" onClick={() => go('github')}>
        Continue with GitHub
      </button>
      <button className="rounded border px-3 py-1" onClick={() => go('google')}>
        Continue with Google
      </button>
    </main>
  )
}
