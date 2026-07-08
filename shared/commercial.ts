// Open-core commercial seam — shared types (imported by the server, the client account UI, and the
// PRIVATE commercial overlay alike). Strut's marketing site + Stripe billing live in a private overlay
// that plugs in via the `#commercial` module (src/commercial/stub.ts by default; an overlay build
// overrides it — see docs/COMMERCIAL_OVERLAY.md). This repo ships only the seam: no billing, no
// marketing, and — with no overlay — the COMMUNITY entitlement below, which equals the historical
// behavior so a clone never regresses and needs no payment setup.

export type AiFeature = 'arrange' | 'generate' | 'chat' | 'image' | 'artifact'

/** What a viewer's plan grants. Resolved server-side (server/entitlements.ts) and, in summary form
 *  ({@link EntitlementSummary}), seeded to the client for the account UI. */
export interface Entitlements {
  /** True only for a paid subscriber (set by the overlay's provider). */
  pro: boolean
  /** Max owned decks; null = unlimited. */
  deckLimit: number | null
  /** Skip the per-user daily AI quota entirely (mirrors the BYO-key path). */
  aiUnlimited: boolean
  /** Per-feature daily-cap overrides; null = use the built-in server/quota.ts constants. */
  aiDailyLimits: Partial<Record<AiFeature, number>> | null
  /** May flip a deck to public ("Anyone with the link"). */
  canPublish: boolean
  /** Drop the PoweredBy / "shared read-only" watermark on shared decks (Pro white-label). */
  whiteLabelShare: boolean
}

/** The no-overlay default — equals this repo's historical behavior (no deck cap, built-in AI caps,
 *  publishing on). Self-hosters get the full app with zero billing setup. */
export const COMMUNITY: Entitlements = {
  pro: false,
  deckLimit: null,
  aiUnlimited: false,
  aiDailyLimits: null,
  canPublish: true,
  whiteLabelShare: false,
}

/** Client-safe projection seeded through the SSR loader (never crosses server/Stripe code to the
 *  browser). `upgradeUrl` null → the account UI renders no upgrade affordance. */
export interface EntitlementSummary {
  isPro: boolean
  upgradeUrl: string | null
  deckLimit: number | null
  canPublish: boolean
}

/** The overlay module contract: `#commercial` exports `commercial: Commercial | null`. */
export interface Commercial {
  /** First crack at a request — serve marketing pages (apex host) + own /api/billing/*. Return a
   *  Response to handle it, or null to fall through to the app (TanStack Start). */
  fetch: (request: Request, ...rest: Array<unknown>) => Promise<Response | null>
  /** Server-side entitlement provider backed by the overlay's subscription store. null → COMMUNITY. */
  entitlements: { get: (userId: string) => Promise<Entitlements> } | null
  /** Absolute pricing/upgrade URL seeded to the client. null → no upgrade UI. */
  upgradeUrl: string | null
}
