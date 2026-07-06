import { useSyncQuery } from '@rindle/react'
import { decksQuery, DECKS_LIMIT } from '../../shared/queries'

/**
 * Session-lifetime keepalive for the dashboard's `decksQuery` coverage. Rendered once at the root
 * (__root.tsx) so it stays mounted across route changes — crucially while a deck is open in the editor.
 *
 * `useSyncQuery` retains the REMOTE sync coverage (the daemon keeps streaming the decks — and their
 * server-computed `slideCount` — into the local replica) WITHOUT materializing the result-tree view.
 * That's the point: we keep the data warm, we don't render it here (hence `return null`).
 *
 * Why it exists: nothing else subscribes to `decksQuery` while you're in the editor, so @rindle's
 * QueryCache drops the dashboard's view ~2s after you leave `/`. Returning then re-materialized a COLD
 * view (fresh qid → `hello` → `view.reset()` → []) that flashed "No decks / 0 presentations" for one
 * daemon round-trip before the first snapshot landed. Holding the coverage warm means the dashboard's
 * `useQuery(decksQuery)` re-materializes against already-resident rows — no round-trip, no empty frame.
 *
 * Note it stays a `useQuery` read on the dashboard (not a local `useRoot` read): `slideCount` is a
 * server-computed `countAs` aggregate and the coverage doesn't sync the underlying slide rows, so a
 * purely-local read would recompute the count as 0. Keeping the read server-authoritative — over warm
 * coverage — is what preserves BOTH correct counts and a flash-free return.
 */
export function DecksKeepalive() {
  useSyncQuery(decksQuery({ limit: DECKS_LIMIT }))
  return null
}
