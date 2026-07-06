// The account control in the dashboard chrome. Guest-first: an anonymous visitor sees a clearly
// visible "Sign in" — so someone who already HAS an account but is currently a fresh guest is never
// stranded — and promoting via GitHub/Google carries their in-progress decks over (server/claim.ts's
// onLinkAccount → claimDecks). A signed-in member sees their identity + Sign out. The OAuth round-trip
// (and sign-out) returns to '/', where the resulting session boots and its decks SSR-seed.

import { useEffect, useRef, useState } from 'react'
import { LogIn, LogOut, User } from 'lucide-react'
import type { SessionAccount } from '../../server/session'
import { authClient } from './authClient'
import { track } from '../lib/analytics'

/** `initial` is the account resolved server-side from the session cookie (appSsr.ts), passed down from
 *  the route loader. It seeds the FIRST paint — server render and the matching client hydration pass
 *  both use it (loaderData is identical across the boundary), so the pill renders its final label with
 *  no empty→pill pop-in. Once the live `useSession()` resolves it takes over; for the same user the
 *  label is unchanged, so there's no visible flip either. */
export function AccountControl({
  initial,
}: {
  initial?: SessionAccount | null
}) {
  const { data: session } = authClient.useSession()
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: PointerEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [open])

  // Prefer the live session once it resolves; until then fall back to the SSR-seeded `initial` account
  // so the pill first-paints with its final label. Both shapes carry name/email/isAnonymous.
  const user = session?.user ?? initial ?? null
  // The anonymous plugin flags guest sessions; treat "no session yet" as guest too.
  const isGuest =
    !user || (user as { isAnonymous?: boolean }).isAnonymous === true
  const member = user && !isGuest ? user : null
  const label = member
    ? member.name && member.name !== 'Anonymous'
      ? member.name
      : member.email
    : 'Sign in'

  function promote(provider: 'github' | 'google') {
    track('account:promote', { provider })
    void authClient.signIn.social({ provider, callbackURL: '/' })
  }
  async function signOut() {
    setOpen(false)
    await authClient.signOut()
    // Reload so a fresh anonymous session is minted (reads stay authorized, app keeps working).
    window.location.assign('/')
  }

  return (
    <div className="acct" ref={wrap}>
      <button
        className="btn btn--ghost acct__btn"
        onClick={() => setOpen((o) => !o)}
      >
        <User size={15} />
        <span className="acct__label">{label}</span>
      </button>
      {open && (
        <div
          className="popover popover--menu acct__menu"
          style={{ top: '110%', right: 0 }}
        >
          {isGuest ? (
            <>
              <div className="menu-label">Save your work</div>
              <button
                className="menu-item menu-item--icon"
                onClick={() => promote('github')}
              >
                <LogIn size={15} /> Continue with GitHub
              </button>
              <button
                className="menu-item menu-item--icon"
                onClick={() => promote('google')}
              >
                <LogIn size={15} /> Continue with Google
              </button>
            </>
          ) : (
            <>
              <div className="menu-label">
                {member ? member.email : 'Signed in'}
              </div>
              <button
                className="menu-item menu-item--icon"
                onClick={signOut}
              >
                <LogOut size={15} /> Sign out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
