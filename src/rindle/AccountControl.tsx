// The account control in the dashboard chrome. Guest-first: an anonymous visitor sees a clearly
// visible "Sign in" — so someone who already HAS an account but is currently a fresh guest is never
// stranded — and promoting via GitHub/Google carries their in-progress decks over (server/claim.ts's
// onLinkAccount → claimDecks). A signed-in member sees their identity + Sign out. The OAuth round-trip
// (and sign-out) returns to '/', where the resulting session boots and its decks SSR-seed.

import { useEffect, useRef, useState } from 'react'
import { LogIn, LogOut, Sparkles, User } from 'lucide-react'
import type { SessionAccount } from '../../server/session'
import type { EntitlementSummary } from '../../shared/commercial'
import { appPath } from '../../shared/appPath'
import { authClient } from './authClient'
import { track } from '../lib/analytics'

/** `initial` is the account resolved server-side from the session cookie (appSsr.ts), passed down from
 *  the route loader. It seeds the FIRST paint — server render and the matching client hydration pass
 *  both use it (loaderData is identical across the boundary), so the pill renders its final label with
 *  no empty→pill pop-in. Once the live `useSession()` resolves it takes over; for the same user the
 *  label is unchanged, so there's no visible flip either. */
export function AccountControl({
  initial,
  entitlement,
}: {
  initial?: SessionAccount | null
  /** The viewer's plan summary (appSsr seed). Drives the Pro badge + Upgrade link. When it's absent or
   *  `upgradeUrl` is null — the open-source build, which has no commercial overlay — no upgrade UI shows. */
  entitlement?: EntitlementSummary | null
}) {
  const { data: session } = authClient.useSession()
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  const isPro = entitlement?.isPro ?? false
  // Only an overlay build seeds a non-null upgradeUrl (its pricing page); null → no upgrade affordance.
  const upgradeUrl = entitlement?.upgradeUrl ?? null

  useEffect(() => {
    if (!open) return
    function onDown(e: PointerEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node))
        setOpen(false)
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
    void authClient.signIn.social({ provider, callbackURL: appPath('/') })
  }
  async function signOut() {
    setOpen(false)
    await authClient.signOut()
    // Reload so a fresh anonymous session is minted (reads stay authorized, app keeps working).
    window.location.assign(appPath('/'))
  }

  return (
    <div className="acct" ref={wrap}>
      <button
        className="btn btn--ghost acct__btn"
        onClick={() => setOpen((o) => !o)}
      >
        <User size={15} />
        <span className="acct__label">{label}</span>
        {isPro && (
          <span
            className="acct__pro"
            style={{
              marginLeft: 6,
              padding: '1px 6px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              lineHeight: 1.4,
              background: 'linear-gradient(90deg,#7c3aed,#db2777)',
              color: '#fff',
            }}
          >
            Pro
          </span>
        )}
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
              {upgradeUrl && !isPro && (
                <a
                  className="menu-item menu-item--icon"
                  href={upgradeUrl}
                  onClick={() => track('account:upgrade_click')}
                >
                  <Sparkles size={15} /> Upgrade to Pro
                </a>
              )}
              <button className="menu-item menu-item--icon" onClick={signOut}>
                <LogOut size={15} /> Sign out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
