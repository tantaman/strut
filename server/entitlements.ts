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

// The features that draw from a POOLED monthly allowance (aiMonthlyPool) — the ones that spend model
// inference. Artifact is deliberately excluded: it spends R2, not tokens, so it keeps its own daily cap
// even on a pooled plan (a Pro user's artifact runs shouldn't eat their AI-message budget).
const POOLED_FEATURES: ReadonlySet<AiFeature> = new Set([
  'arrange',
  'generate',
  'chat',
  'image',
])

/** How an AI feature should be metered for this plan, for use by the AI route quota gates (which pass the
 *  returned object straight to `consumeAiQuota`/`refundAiQuota` in server/quota.ts). Three outcomes:
 *   - `{ meter: false }`                     → unlimited: skip the quota entirely (like the BYO-key path).
 *   - `{ meter: true, window: 'month', limit }` → the pooled monthly allowance (one counter across the four
 *                                                inference features); `limit` is always a number.
 *   - `{ meter: true, window: 'day', limit }`   → the per-feature daily cap; `limit` undefined ⇒ the
 *                                                built-in server/quota default constant.
 *  Condition on `.meter` so TS narrows `.window`/`.limit` (e.g. `if (!byo && ai.meter) consumeAiQuota(…, ai)`). */
export type AiMetering =
  | { meter: false }
  | { meter: true; window: 'month'; limit: number }
  | { meter: true; window: 'day'; limit: number | undefined }

export function aiMetering(ent: Entitlements, feature: AiFeature): AiMetering {
  if (ent.aiUnlimited) return { meter: false }
  if (ent.aiMonthlyPool != null && POOLED_FEATURES.has(feature)) {
    return { meter: true, window: 'month', limit: ent.aiMonthlyPool }
  }
  return { meter: true, window: 'day', limit: ent.aiDailyLimits?.[feature] }
}

/** The client-safe projection for the account UI, seeded through the SSR loader. `upgradeUrl` comes
 *  from the overlay (null in this repo → the account UI renders no upgrade affordance). */
export function entitlementSummary(ent: Entitlements): EntitlementSummary {
  return {
    isPro: ent.pro,
    upgradeUrl: commercial?.upgradeUrl ?? null,
    canKeepPrivate: ent.canKeepPrivate,
  }
}
