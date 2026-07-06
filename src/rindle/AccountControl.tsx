// The account control in the dashboard chrome. Guest-first: an anonymous visitor sees a clearly
// visible "Sign in" — so someone who already HAS an account but is currently a fresh guest is never
// stranded — and promoting via GitHub/Google carries their in-progress decks over (server/claim.ts's
// onLinkAccount → claimDecks). A signed-in member sees their identity + Sign out. The OAuth round-trip
// (and sign-out) returns to '/', where the resulting session boots and its decks SSR-seed.

import { useEffect, useRef, useState } from 'react'
import { LogIn, LogOut, User } from 'lucide-react'
import { authClient } from './authClient'

export function AccountControl() {
  const { data: session, isPending } = authClient.useSession()
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

  const user = session?.user
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
    void authClient.signIn.social({ provider, callbackURL: '/' })
  }
  async function signOut() {
    setOpen(false)
    await authClient.signOut()
    // Reload so a fresh anonymous session is minted (reads stay authorized, app keeps working).
    window.location.assign('/')
  }

  // Before the session resolves, reserve the slot without committing to a label (no flip on hydrate).
  if (isPending && !session) return <div className="acct" aria-hidden />

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
