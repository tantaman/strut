// Open-core commercial seam — shared types (imported by the server, the client account UI, and the
// PRIVATE commercial overlay alike). Strut's marketing site + Stripe billing live in a private overlay
// that plugs in via the `#commercial` module (src/commercial/stub.ts by default; an overlay build
// overrides it — see docs/COMMERCIAL_OVERLAY.md). This repo ships only the seam: no billing, no
// marketing, and — with no overlay — the COMMUNITY entitlement below, which equals the historical
// behavior so a clone never regresses and needs no payment setup.

/** What a viewer's plan grants. Resolved server-side (server/entitlements.ts) and, in summary form
 *  ({@link EntitlementSummary}), seeded to the client for the account UI. */
export interface Entitlements {
  /** True only for a paid subscriber (set by the overlay's provider). */
  pro: boolean
  /** May a deck be PRIVATE? The pricing wedge: public/link-shared decks are free & uncapped, keeping a
   *  deck private is the paid feature. false → new decks are created public and cannot be set private.
   *  (COMMUNITY/self-host = true: decks are private by default, exactly as before.) */
  canKeepPrivate: boolean
  /** Total storage ceiling (bytes) across the account's uploaded images; null = unlimited. Enforced on
   *  the R2 upload path via server/storage.ts's per-user counter. Artifacts are excluded: they are small,
   *  content-addressed, and protected by a light burst throttle. */
  storageLimitBytes: number | null
  /** Drop the PoweredBy / "shared read-only" watermark on shared decks (Pro white-label). */
  whiteLabelShare: boolean
}

/** The no-overlay default — private decks allowed and no hosted-storage cap. AI remains BYOK, as it is on
 *  every hosted plan. Self-hosters get the full app with zero billing setup. */
export const COMMUNITY: Entitlements = {
  pro: false,
  canKeepPrivate: true,
  storageLimitBytes: null,
  whiteLabelShare: false,
}

/** Client-safe projection seeded through the SSR loader (never crosses server/Stripe code to the
 *  browser). `upgradeUrl` null → the account UI renders no upgrade affordance. */
export interface EntitlementSummary {
  isPro: boolean
  upgradeUrl: string | null
  /** false → the client creates new decks public and hides the "make private" control (a free viewer). */
  canKeepPrivate: boolean
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
