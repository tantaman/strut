// Authoritative reassignment of a promoted guest's rindle rows to their real account (Phase 5 /
// strut-auth-guest-first). Runs server-side ONLY — fired from server/claim.ts's onLinkAccount hook,
// never reachable from the public /api/rindle route — so a client can never call it to steal another
// user's decks. Isolated in its own module so the daemon wiring loads only on the (rare) promotion path.
//
// The reassignment is a single authoritative daemon SQL txn (executeSqlTxn → versioned `cv`/`txId`), so
// live subscribers reconcile: the guest's decksQuery loses the decks, the account's gains them. Only the
// user-keyed columns move — deck.owner_id (the decks themselves) and deck_share.user_id (collaborations
// the guest was granted). The guest's user_profile PK is left alone (the real account keeps its own).

import { HttpRindleDaemonClient } from '@rindle/daemon-client'

const DAEMON_URL = process.env.RINDLE_DAEMON_URL ?? 'http://127.0.0.1:7610'

export async function claimDecks(from: string, to: string): Promise<void> {
  const daemon = new HttpRindleDaemonClient({
    baseUrl: DAEMON_URL,
    headers: { authorization: `Bearer ${process.env.RINDLE_DAEMON_TOKEN ?? ''}` },
  })
  const out = await daemon.executeSqlTxn({
    idempotencyKey: `claim:${from}->${to}`,
    statements: [
      { sql: 'UPDATE deck SET owner_id = ? WHERE owner_id = ?', params: [to, from] },
      {
        sql: 'UPDATE deck_share SET user_id = ? WHERE user_id = ?',
        params: [to, from],
      },
    ],
  })
  console.log(
    `[claim] reassigned guest ${from} → account ${to} (cv=${out.cv}, txId=${out.txId})`,
  )
}
