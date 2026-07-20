// Authoritative reassignment of a promoted guest's rindle rows to their real account (Phase 5 /
// strut-auth-guest-first). Runs server-side ONLY — fired from server/claim.ts's onLinkAccount hook,
// never reachable from the public /api/rindle route — so a client can never call it to steal another
// user's decks. Isolated in its own module so the daemon wiring loads only on the (rare) promotion path.
//
// The reassignment is a single authoritative SQL txn through the unified Rindle ingress, so live
// subscribers reconcile:
// the guest's decksQuery loses the decks, the account's gains them. Only the user-keyed columns move —
// deck.owner_id (the decks themselves) and deck_share.user_id (collaborations the guest was granted).
// The guest's user_profile PK is left alone (the real account keeps its own).

import { createSqlClient } from '@rindle/sql-client'

const RINDLE_URL = process.env.RINDLE_URL ?? 'http://127.0.0.1:7650'
const RINDLE_TOKEN = process.env.RINDLE_DATABASE_TOKEN ?? 'rindle-dev-sql-token'

export async function claimDecks(from: string, to: string): Promise<void> {
  const sql = createSqlClient({ url: RINDLE_URL, authToken: RINDLE_TOKEN })
  try {
    // Safe to retry after an OCC conflict: once the first commit wins there are no remaining `from`
    // rows, so a repeated callback is an accepted no-op.
    await sql.withTransactionRetry(async (tx) => {
      await tx.execute({
        sql: 'UPDATE deck SET owner_id = ? WHERE owner_id = ?',
        args: [to, from],
      })
      await tx.execute({
        sql: 'UPDATE deck_share SET user_id = ? WHERE user_id = ?',
        args: [to, from],
      })
    })
  } finally {
    sql.close()
  }
  console.log(`[claim] reassigned guest ${from} → account ${to}`)
}
