# Strut

[<img width="3024" height="1656" alt="CleanShot 2026-07-06 at 10 09 49@2x" src="https://github.com/user-attachments/assets/0da40e11-d44d-42fd-ad76-cdfe43749b12" />](https://strut.io/)

An HTML5 GUI authoring tool for **spatial presentations** — build a deck of slides, place rich
content on each, arrange the slides in 3-D space, and play the deck as a camera flight through that
world (the impress.js model, made visual and editable).

## Stack

- **React 19** + **[TanStack Start](https://tanstack.com/start)** (file-based routing, SSR) on **Vite**.
- **[Rindle](https://rindle.sh)** for the data layer (wired): SQL migrations as source of truth →
  generated TypeScript schema → optimistic local store + live windowed queries + named mutators, with
  a replicated Rindle data tier behind the app's own server routes. See `RINDLE_NOTES.md` for the
  write-up.
- Plain CSS for the editor chrome (`src/strut.css`); Tailwind is available for one-offs.

## Architecture

- **Rindle data tier** — a `rindle-replicator` write-master (`:7611`) feeds a read-only `rindled`
  follower (`:7600`) behind a stable local fleet edge (`:7650`). `rindle.ncl` is the single topology
  definition, and the edge is the app's one read/write/WebSocket ingress.
- **API** — TanStack Start server routes (`src/routes/api.rindle.*`) host the stateless Rindle API
  (`server/rindle-api.ts`): they validate args, run authoritative SQL mutators, and register named
  queries through that one ingress. Same-origin, no separate process. Image uploads
  (`server/upload.ts`) go to Cloudflare R2 — a native bucket binding on Workers, the S3 API on other
  hosts, else a local dev fallback. Mirrors the predicted client mutators in `shared/app-def.ts`.
- **Browser client** (`src/rindle/*`) — the optimistic store (`@rindle/optimistic` + WASM), `useQuery`
  live reads, and `app.mutate.*` writes, posting to `/api/rindle/*`. The live-query WebSocket uses the
  same Rindle URL with follower affinity.

Schema lives in `migrations/`; `shared/` holds the generated schema, query builder, named queries, and
client mutators (imported by both browser and server). App code is in `src/` (`routes/`, `editor/`,
`rindle/`).

## Getting started

The normal local run path is a single command:

```bash
pnpm install

pnpm dev
```

Then open http://localhost:3000.

`pnpm dev` delegates the whole local lifecycle to `rindle dev`. It renders `rindle.ncl`, starts the
write-master, follower, and fleet edge, waits for all three to become ready, applies migrations,
regenerates `shared/schema.ts`, and only then launches Vite with `RINDLE_URL` plus the server-side
database token. Rindle also owns signal forwarding and teardown, so the command exits cleanly as one
unit. The Rindle API and image upload endpoints are served by the TanStack Start process under
`/api/rindle/*`; there is no separate API server to start.

Local Rindle state lives in `master.db` and `follower-0.db`; uploads live in `.uploads/`. Image
uploads work with no config by using the local fallback. Copy `.env.example` to `.env` only for
optional overrides; `rindle dev` supplies the local data-tier bindings automatically.

If you need to run the processes separately:

```bash
pnpm daemon   # replicator + follower + fleet edge + migration/schema watcher
pnpm dev:web  # web app + same-origin API routes; expects `pnpm daemon` to be running
```

`rindle exec` lets the split web process derive the same `RINDLE_URL` and
`RINDLE_DATABASE_TOKEN` from `rindle.ncl`. There are no copied topology ports or role-specific
credentials in the app config.

Other scripts:

```bash
pnpm build            # production build (client + SSR + API routes); does not start the daemon
pnpm preview          # preview the built app through the topology-derived Rindle binding
pnpm generate-routes  # regenerate src/routeTree.gen.ts
pnpm setup            # one-shot migrate + schema regen against a running local topology
pnpm test             # vitest
pnpm lint             # eslint
pnpm check            # prettier check
```

## Deploying to Cloudflare

The web app (SSR + `/api/rindle/*` routes) deploys to **Cloudflare Workers**, with image uploads in
**R2** via a native bucket binding. The Rindle replicator/follower fleet must be hosted separately.
`pnpm deploy` builds the Worker (`CF=1 vite build`) and ships it with `wrangler`. Local `pnpm dev` and
`pnpm build` stay on Node. See **[`docs/DEPLOY_CLOUDFLARE.md`](docs/DEPLOY_CLOUDFLARE.md)** for the
data-tier bindings, R2 setup, secrets, and deploy steps.

## Commercial / hosted (optional)

Strut is fully open source and self-hostable for free. The **official hosted** Strut (marketing page +
paid **Pro** accounts via Stripe) is a **private overlay** kept out of this repo and merged in only at
deploy time — so a clone has **no billing, no marketing, and no paywall**, and behaves exactly as it does
today. This follows the same opt-in posture as the analytics above.

The repo ships the open-core **seam** (`#commercial`) that an overlay plugs into: the app _reads_ an
entitlement (`server/entitlements.ts`) to lift AI caps / the deck cap / publishing, and _renders_ an
optional Upgrade affordance — all inert without an overlay. `pnpm deploy` builds the free app on a single
host; `pnpm deploy:pro` builds the app **plus** the overlay as one Worker (marketing on `strut.io`, the
app on `strut.io/app`). See **[`docs/COMMERCIAL_OVERLAY.md`](docs/COMMERCIAL_OVERLAY.md)**.

## Analytics

Strut ships with **optional**, privacy-first product analytics via [Umami](https://umami.is) —
cookieless, no personal data, no consent banner. It records only which features get used (slides
generated, AI arrange applied, present started, exports, sign-ins) — never your deck content, prompts,
or any PII.

It is **off by default and off in every clone.** Nothing is collected and no script loads unless the
build sets `VITE_UMAMI_SRC` (+ `VITE_UMAMI_ID`) — so cloning this repo phones home to no one. To enable
it on your own deployment, set those two build-time vars (see [`.env.example`](.env.example)); point
`VITE_UMAMI_SRC` at Umami Cloud or your own self-hosted instance. Implementation lives in
[`src/lib/analytics.ts`](src/lib/analytics.ts).
