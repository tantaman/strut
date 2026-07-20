// Guest → account promotion (AUTH_PLAN Phase 5). When an anonymous visitor signs in with GitHub/Google,
// better-auth's anonymous plugin fires this hook right before it links (and then deletes) the guest
// user. We reassign the guest's in-progress rindle rows (deck ownership + collaborator + authored
// components) to the real account so nothing they made is lost — the ChatGPT/Qwen-style "keep my work"
// handoff (see strut-auth-guest-first).
//
// NOTE: decks live in Rindle, not the auth DB, so the reassignment is issued authoritatively against
// the replicator write-master (server-side only, with its control token) — never through the public
// /api/rindle route, so a client can never invoke it to steal another user's decks. The concrete
// reassignment is wired in Phase 3 (claimDecks); this hook is the stable seam better-auth calls.

/** better-auth anonymous plugin `onLinkAccount` payload (typed structurally to avoid importing the
 *  plugin's internal types here). */
interface GuestPromotion {
  anonymousUser: { user: { id: string } & Record<string, unknown> }
  newUser: { user: { id: string } & Record<string, unknown> }
}

/** Reassign a promoted guest's rindle rows to their new account. Best-effort: a failure here must not
 *  block sign-in (the account is still created; only the in-progress guest decks would be orphaned). */
export async function onGuestPromotion({
  anonymousUser,
  newUser,
}: GuestPromotion): Promise<void> {
  const from = anonymousUser.user.id
  const to = newUser.user.id
  if (!from || !to || from === to) return
  try {
    const { claimDecks } = await import('./claimDecks.ts')
    await claimDecks(from, to)
  } catch (err) {
    // Don't fail the promotion — surface it for `wrangler tail` and move on.
    console.error(
      `[claim] failed to reassign decks ${from} → ${to}:`,
      err instanceof Error ? err.message : err,
    )
  }
}
