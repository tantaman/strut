# Accounts & Auth — Better-Auth + social sign-in — Implementation Plan

Status: **proposed** (not yet implemented). Prerequisite for the BYO-LLM credential store
(`OPENROUTER_PLAN.md`) — you cannot attach paid LLM credentials to a spoofable identity.

## Goal

Give every Strut user a real, server-verified account, with easy social sign-in (**GitHub / Google /
Apple**). Replace today's spoofable per-browser identity with an unforgeable session, so ownership and
sharing are actually *authenticated*, not just enforced.

## What exists today

- Identity is a browser-minted UUID in `localStorage`, returned by `currentUser()`
  (`src/rindle/user.ts`) and sent as an `x-user` HTTP header (`src/rindle/client.ts:42`).
- The server **trusts that header verbatim** as the principal (`server/rindle-api.ts` `handleRindleJson`,
  ~`:572`); the only gate is "non-empty string" (`authorizeQuery` / `authorizeMutation`, ~`:557`).
- Real *authorization* already exists in SQL: `deckAccess(user)` = owner-or-shared, and
  `publicAccess(token)` = anonymous read via `share_token`, both in `server/queries.ts`; row-level
  mutator guards (`EDITABLE_DECKS` / `EDITABLE_SLIDES`) in `server/rindle-api.ts`. Ownership columns
  (`owner_id`, `visibility`, `share_token`, `deck_share.role`) come from
  `migrations/0002_ownership_sharing.sql`; display names from `migrations/0003_profiles.sql`
  (`user_profile`).
- The Worker has **no SQL/KV binding** — only R2 (`dist/server/wrangler.json`). The real DB (Rindle) is
  a SQLite daemon on Fly.io reached over HTTP/WS via the daemon client, **not** a connection an ORM can
  use.

So: authorization is well-built; **authentication is the missing half.** The header is spoofable —
anyone can send any `x-user` and act as anyone.

## Load-bearing decisions

- **Better-Auth stores its tables in a new Cloudflare D1 database, not in Rindle.** The Worker has no SQL
  store today; add a D1 binding (`DB`) and use Better-Auth's D1 (Kysely/Drizzle) adapter — confirm the
  current adapter name against Better-Auth docs. Auth/session data must **not** live in Rindle, which
  replicates every row to every browser.
- **D1 also absorbs the encrypted model-credential store** the AI plan needed — one binding, no separate
  KV.
- **The session cookie replaces the `x-user` header as the source of truth.** Same-origin `/api/rindle/*`
  requests carry the Better-Auth cookie automatically; the Worker resolves it to a verified user id and
  **ignores any client-supplied principal**.
- **The hard "must be signed in" gate applies to creating/editing, not to public viewing.** Anonymous
  read of `visibility='public-read'` decks via `share_token` (`share.$deckId.tsx`,
  `deck.$deckId_.play.tsx`, `publicAccess`) stays anonymous — otherwise sharing breaks.
- **Recommended: Better-Auth anonymous plugin (guest-then-link), not a front-door wall.** Every visitor
  gets an unforgeable *guest* session instantly (preserves local-first "open and start editing"), which
  already satisfies the security prerequisite (server-issued, non-spoofable). Require a *linked* social
  account only at a chosen action (first share, or connecting a model). Hard-gating the whole app is the
  simpler alternative — see Open forks.
- **Ship GitHub + Google first; Apple fast-follows.** Apple needs a paid Developer Program account and a
  client secret that is a signed JWT rotated ~every 6 months.

## What "unforgeable" buys the AI feature

The security risk we're mitigating is: *someone spoofs another user and burns their LLM credits.* A
server-issued Better-Auth session (guest **or** social-linked) is signed and unforgeable, so it closes
that risk on its own. Requiring a *linked* social account is therefore a **product** choice (real
identity, recovery, cross-device), decoupled from the **security** requirement (unforgeable principal).

## Sequencing

Phase 1–3 is the shippable core (D1 + Better-Auth + GitHub/Google + the `x-user` bridge). Phase 4 adds
Apple; Phase 5 the guest→linked claim flow. Then the BYO-LLM credential work (`OPENROUTER_PLAN.md`) can proceed.

---

## Phase 1 — D1 + Better-Auth server instance

- **`wrangler.jsonc`** — add a `d1_databases` binding `DB` (create via `wrangler d1 create strut-auth`).
  `nodejs_compat` is already set.
- **Secrets** (`wrangler secret put`): `BETTER_AUTH_SECRET`. **Vars:** `BETTER_AUTH_URL` = deployed
  origin (for redirect/trusted origins).
- **`server/auth.ts`** (new) — construct the Better-Auth instance with the D1 adapter, cookie sessions,
  and `trustedOrigins`. Read the `DB` binding from `cloudflare:workers` (same pattern as
  `server/cf-env.ts` reads `STRUT_UPLOADS`).
- **`src/routes/api.auth.$.tsx`** (new) — catch-all route mounting `auth.handler(request)` at
  `/api/auth/*` (sign-in, callback, session endpoints).
- **Tables** — generate Better-Auth's schema into D1 (its CLI/migrate). These are D1-native migrations,
  **separate** from the Rindle `migrations/` SQL (which is the daemon's schema).

## Phase 2 — Social sign-in (GitHub + Google)

- Register OAuth apps (GitHub, Google Cloud); set callback to `${BETTER_AUTH_URL}/api/auth/callback/*`.
- Secrets: `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`;
  wire into `server/auth.ts` `socialProviders`.
- **Client** — `src/rindle/authClient.ts` (new) via `better-auth/react` `createAuthClient`; expose
  `signIn.social({ provider })`, `useSession()`, `signOut()`.
- **UI** — a sign-in surface (`src/routes/signin.tsx` or a modal) with GitHub/Google buttons.

## Phase 3 — The identity bridge + route guards (the real cutover)

- **Server principal from session, not header.** In `server/rindle-api.ts` `handleRindleJson`, resolve
  the user by calling `auth.api.getSession({ headers })` (reads the cookie) instead of
  `request.headers.get('x-user')`. Feed that id to the existing `authorize*` gates and mutator/query
  twins — **ignore any client `x-user`.** `deckAccess` / `publicAccess` are unchanged.
- **Client stops self-identifying.** Drop or neuter the `x-user` header in `src/rindle/client.ts:42`;
  `currentUser()` / `src/rindle/user.ts` is retired (or repurposed to read the session).
- **Guard editor/dashboard routes** (`src/routes/index.tsx`, `deck.$deckId.tsx`) with a TanStack
  `beforeLoad`/server-fn session check → redirect to sign-in when required. **Do not guard**
  `share.$deckId.tsx` or `deck.$deckId_.play.tsx` (public/presenter stay anonymous).
- **Live-query channel (mostly resolved — it's a lease/capability model).** The browser opens the WS
  directly to the daemon (`RINDLE_DAEMON_WS`), but reads are two-hop: `POST /api/rindle/query` hits the
  **gated Worker** (`authorizeQuery` + `deckAccess`/`publicAccess`), which returns a daemon **lease**
  (`{ materializationId, leaseToken, queryKey }`, RINDLE_NOTES.md:65); the WS then only streams
  materializations you hold a valid `leaseToken` for. So the WS is **downstream of the HTTP gate** —
  swapping `x-user` for the session on `/api/rindle/query` (above) secures the WS too; **no separate WS
  auth to build.** Residuals to confirm against `@rindle/daemon` (not strut code): (1) `leaseToken` is
  unguessable and can't be tampered to widen scope; (2) leases expire / revoke on access change
  (un-share, `public-read`→`private`, sign-out) rather than streaming stale rows; (3) the daemon rejects
  WS subscriptions that don't present a valid lease.

## Phase 4 — Apple sign-in

- Apple Developer Program: App ID + Services ID + Sign-in-with-Apple key; client secret is a signed JWT
  (rotate ≤6 months — script it). Return URL config. Add to `socialProviders`.

## Phase 5 — Guest → linked account (recommended, if going guest-first)

- Enable Better-Auth's **anonymous plugin** so first visit mints a guest session (keeps local-first
  friction at zero). On social sign-in, **link** the guest → real user so in-progress decks carry over.
- This also covers **pre-auth deck migration**: decks whose `owner_id` is an old `localStorage` UUID can
  be claimed on first sign-in by reassigning `owner_id` (a Rindle mutation) from the carried id — or,
  pre-launch, simply accept orphaning them (see Open forks).

---

## Open forks

- **Hard gate vs. guest-then-link.** Recommended: guest-then-link (Phase 5) — preserves local-first
  entry, still unforgeable. Alternative: wall the whole app behind sign-in (drop Phase 5, guard at
  `__root`). Security is equivalent; UX and complexity differ.
- **Do public viewers need accounts?** Assumed **no** (gate edit only). Override if you truly want to
  gate viewing.
- **Existing anonymous decks.** Migrate/claim (Phase 5) vs. accept orphaning (pre-launch, simplest).
- **D1 vs. other store.** D1 recommended (native to Workers, idiomatic Better-Auth). A Postgres on Fly is
  possible but adds infra.

## File map

- Trust boundary to change: `server/rindle-api.ts` (`handleRindleJson`, `authorize*`), `server/queries.ts`.
- Identity to retire/repurpose: `src/rindle/user.ts`, `src/rindle/client.ts:42`.
- Ownership schema (unchanged): `migrations/0002_ownership_sharing.sql`, `migrations/0003_profiles.sql`.
- Public routes to leave anonymous: `src/routes/share.$deckId.tsx`, `src/routes/deck.$deckId_.play.tsx`.
- Worker config: `wrangler.jsonc`, R2-binding pattern in `server/cf-env.ts`.
- New in this plan: `server/auth.ts`, `src/routes/api.auth.$.tsx`, `src/rindle/authClient.ts`,
  `src/routes/signin.tsx`.
</content>
