# Commercial overlay (open-core)

Strut the app is **open source**. The **official, hosted** Strut adds a marketing/product page and
**paid Pro accounts** (Stripe) — code we keep **out of this repo**. This document explains the seam that
makes both true at once: a single Cloudflare Worker serves the open-source app _and_ a private
commercial overlay, and a plain clone (no overlay) is the full, free, self-hostable app that phones home
to no one.

This mirrors the repo's existing "commercial is opt-in" posture (Umami analytics, BYO-LLM): the seams
here are **inert** until an overlay is supplied.

## How it fits together

```
                     ┌──────────────── ONE Cloudflare Worker ────────────────┐
 strut.io/       ───▶│ worker-entry.ts → commercial.fetch()  (marketing +    │  ← private overlay
 strut.io/pricing ──▶│   /api/billing/*), else fall through to the app       │
 strut.io/app/*  ───▶│ TanStack Start `forward` — the app + /app/api/*       │  ← this repo
 sandbox.strut.io ─▶ │ existing artifact-only host branch                    │
                     └───────────────────────┬───────────────────────────────┘
                                              │ getEntitlements(userId)
                                    ┌─────────▼─────────┐
                                    │ auth D1 (binding  │  users/sessions/quota + `subscription`
                                    │ DB)               │
                                    └───────────────────┘
```

- **Pro is pure feature-gating.** Decks live in one shared Rindle daemon DB scoped by `owner_id`; tier
  never touches storage. The Pro entitlement is a row in the **auth D1** (never Rindle → never syncs to
  the browser), read on the server to raise AI caps, lift the deck cap, and allow publishing.

## The seam: `#commercial`

`#commercial` is a bare module specifier resolved two ways:

- **This repo (default):** `package.json` `imports` + `tsconfig.json` `paths` map it to
  `src/commercial/stub.ts`, which exports `commercial = null`.
- **Overlay build:** `vite.config.ts` sets `resolve.alias['#commercial']` to the overlay entry when
  `process.env.STRUT_COMMERCIAL` is set (Vite alias wins over the tsconfig fallback).

The contract (`shared/commercial.ts`):

```ts
interface Commercial {
  // First crack at a request — marketing pages (apex host) + /api/billing/*. Return a Response to
  // handle it, or null to fall through to the app. The overlay decides by host/path itself.
  fetch(request: Request, ...rest: unknown[]): Promise<Response | null>
  // Server-side entitlement provider backed by the overlay's subscription store. null → COMMUNITY.
  entitlements: { get(userId: string): Promise<Entitlements> } | null
  // Absolute pricing/upgrade URL seeded to the client account UI. null → no upgrade affordance shows.
  upgradeUrl: string | null
}
```

Two consumers in this repo import `#commercial`:

- `src/worker-entry.ts` — calls `commercial.fetch()` before the app handler (host branch).
- `server/entitlements.ts` — `getEntitlements(userId)` delegates to `commercial.entitlements` or returns
  `COMMUNITY` (this repo's historical defaults: no deck cap, built-in AI caps, publishing on).

## What the app gates on entitlements

All of these are no-ops under `COMMUNITY` (a clone/self-host), so nothing changes without an overlay:

| Gate                     | Where                                                                                                  | COMMUNITY behavior                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| AI daily caps            | the six `if (!byo && ai.meter)` sites in `src/routes/api.*` + `server/artifact.ts`, via `aiMetering()` | built-in `server/quota.ts` constants |
| Deck cap                 | `createDeckCapped` in `server/rindle-api.ts`                                                           | `deckLimit: null` → unlimited        |
| Publishing               | `setDeckVisibilityGuarded` in `server/rindle-api.ts`                                                   | `canPublish: true`                   |
| Pro badge / Upgrade link | `src/rindle/AccountControl.tsx` (seeded via `appSsr.ts`)                                               | `upgradeUrl: null` → hidden          |

## Building an overlay

An overlay is a directory (its own private repo) cloned in at `commercial/` (git-ignored). It provides a
module that `export const commercial: Commercial`. A reference implementation ships in `commercial/`
(see `commercial/README.md`) with:

- `index.ts` — the `Commercial` impl (marketing routing + Stripe checkout/portal/webhook + entitlements).
- `subscription.ts` — a per-user `subscription` row in the auth D1 (mirrors `server/modelCred.ts`'s dual
  D1/better-sqlite3 store, minus crypto; self-creates its table).
- `stripe.ts` — Stripe via `fetch` + WebCrypto (no SDK, no Node crypto → runs on Workers).
- `marketing.ts` — the product/pricing page (plain, theme-aware HTML).
- `plans.ts` — the FREE/PRO entitlement sets (pricing/packaging stays private).
- `wrangler.jsonc` — a full config serving marketing at `/`, app at `/app`, plus auth/Stripe vars.

## Build & deploy envs

| Env                  | Set for | Effect                                                                                  |
| -------------------- | ------- | --------------------------------------------------------------------------------------- |
| `STRUT_COMMERCIAL`   | build   | Path to the overlay entry; aliases `#commercial` to it.                                 |
| `WRANGLER_CONFIG`    | build   | Alternate wrangler config (`cloudflare({ configPath })`) — the overlay's routes + vars. |
| `STRUT_APP_BASEPATH` | build   | Optional override for the hosted app mount path. Commercial builds default to `/app`.   |

One-command deploy (`package.json`):

```bash
pnpm deploy:pro    # applies auth migrations, builds app+overlay as one Worker, ships it
pnpm preview:pro   # same build, local preview
```

The base `pnpm deploy` is unchanged — a clone with no overlay deploys the free app on a single host.

## Path-split checklist (official cutover)

Moving the app from the apex to `strut.io/app`:

1. Keep the `strut.io` custom-domain route (done in `commercial/wrangler.jsonc`); remove `app.strut.io`.
2. `BETTER_AUTH_URL=https://strut.io`; Better Auth is mounted at `/app/api/auth`.
3. **Update the GitHub/Google OAuth apps** — callback URLs to
   `https://strut.io/app/api/auth/callback/*`.
4. Point the Stripe webhook at `https://strut.io/api/billing/webhook`.
