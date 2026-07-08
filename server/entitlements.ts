// The ONE place the app asks "what may this user do?". The AI quota gates (server/quota.ts callers),
// the deck-count + publish guards (server/rindle-api.ts), and the dashboard account-UI seed
// (src/rindle/appSsr.ts) all route through getEntitlements. It holds NO billing: it delegates to the
// private commercial overlay's provider (`#commercial`) when one is present, else returns COMMUNITY —
// this repo's historical defaults — so an open-source clone behaves exactly as before and needs no
// Stripe/subscription setup. The entitlement lives in the auth D1 (written by the overlay's Stripe
// webhook), never in Rindle, so it never syncs to the browser.

import { commercial } from '#commercial'
import { COMMUNITY } from '../shared/commercial.ts'
import type {
  AiFeature,
  Entitlements,
  EntitlementSummary,
} from '../shared/commercial.ts'

export { COMMUNITY }
export type { AiFeature, Entitlements, EntitlementSummary }

/** Resolve a user's plan. With no commercial overlay this is a pure constant (no I/O); with an overlay
 *  it reads the overlay's subscription store (auth D1). Never throws — a provider failure falls back to
 *  COMMUNITY so a billing outage can't lock users out of the free surface. */
export async function getEntitlements(userId: string): Promise<Entitlements> {
  const provider = commercial?.entitlements
  if (!provider) return COMMUNITY
  try {
    return await provider.get(userId)
  } catch (err) {
    console.error(
      '[entitlements] provider failed; falling back to COMMUNITY:',
      err instanceof Error ? err.message : err,
    )
    return COMMUNITY
  }
}

/** How an AI feature should be metered for this plan, for use by the AI route quota gates:
 *   - `{ meter: false }`             → unlimited: skip the daily quota entirely (like the BYO-key path).
 *   - `{ meter: true, limit }`       → enforce `limit`/day; `limit` undefined ⇒ the built-in server/quota
 *                                      default constant. Condition on the returned `.meter` so TS narrows
 *                                      `.limit` (e.g. `if (!byo && ai.meter) consume(..., ai.limit)`). */
export function aiMetering(
  ent: Entitlements,
  feature: AiFeature,
): { meter: false } | { meter: true; limit: number | undefined } {
  if (ent.aiUnlimited) return { meter: false }
  return { meter: true, limit: ent.aiDailyLimits?.[feature] }
}

/** The client-safe projection for the account UI, seeded through the SSR loader. `upgradeUrl` comes
 *  from the overlay (null in this repo → the account UI renders no upgrade affordance). */
export function entitlementSummary(ent: Entitlements): EntitlementSummary {
  return {
    isPro: ent.pro,
    upgradeUrl: commercial?.upgradeUrl ?? null,
    deckLimit: ent.deckLimit,
    canPublish: ent.canPublish,
  }
}
