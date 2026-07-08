# Strut

[<img width="3024" height="1656" alt="CleanShot 2026-07-06 at 10 09 49@2x" src="https://github.com/user-attachments/assets/0da40e11-d44d-42fd-ad76-cdfe43749b12" />](https://strut.io/)

An HTML5 GUI authoring tool for **spatial presentations** — build a deck of slides, place rich
content on each, arrange the slides in 3-D space, and play the deck as a camera flight through that
world (the impress.js model, made visual and editable).

## Stack

- **React 19** + **[TanStack Start](https://tanstack.com/start)** (file-based routing, SSR) on **Vite**.
- **[Rindle](https://rindle.sh)** for the data layer (wired): SQL migrations as source of truth →
  generated TypeScript schema → optimistic local store + live windowed queries + named mutators, with
  a `rindled` daemon behind the app's own server routes. See `RINDLE_NOTES.md` for the write-up.
- Plain CSS for the editor chrome (`src/strut.css`); Tailwind is available for one-offs.

## Architecture

- **`rindled` daemon** — owns the SQLite DB + the live-query WebSocket (`:7600` control, `:7601` ws).
- **API** — TanStack Start server routes (`src/routes/api.rindle.*`) host the stateless Rindle API
  (`server/rindle-api.ts`): they validate args, run authoritative SQL mutators, and register the named
  queries. Same-origin, no separate process. Image uploads (`server/upload.ts`) go to Cloudflare R2 —
  a native bucket binding on Workers, the S3 API on other hosts, else a local dev fallback. Mirrors the
  predicted client mutators in `shared/app-def.ts`.
- **Browser client** (`src/rindle/*`) — the optimistic store (`@rindle/optimistic` + WASM), `useQuery`
  live reads, and `app.mutate.*` writes, posting to `/api/rindle/*`. The live-query WebSocket connects
  directly to the daemon (`:7601`).

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

`pnpm dev` runs two processes with `concurrently`:

- `rindle up --migrate --gen shared/schema.ts --watch` — starts the daemon from `daemon.json`, applies
  migrations, regenerates `shared/schema.ts`, and keeps watching `migrations/`.
- `vite dev --port 3000` — starts the TanStack Start app on http://localhost:3000. The Rindle API and
  image upload endpoints are served by this same web process under `/api/rindle/*`; there is no
  separate API server to start.

Local state lives in `rindle.db` and `.uploads/`. Image uploads work with no config by using the local
fallback; copy `.env.example` to `.env` only if you want uploads stored in Cloudflare R2. `vite.config.ts`
loads `.env` for server-side values during `vite dev`.

If you need to run the processes separately:

```bash
pnpm daemon   # daemon + migration/schema watcher
pnpm dev:web  # web app + same-origin API routes; expects the daemon to already be running
```

By default the daemon control plane is `http://127.0.0.1:7600` and the live-query WebSocket is
`ws://127.0.0.1:7601`. Override them with `RINDLE_DAEMON_URL` for the server/API side and
`VITE_RINDLE_WS` for the browser side.

Other scripts:

```bash
pnpm build            # production build (client + SSR + API routes); does not start the daemon
pnpm preview          # preview the built app; expects a reachable daemon
pnpm generate-routes  # regenerate src/routeTree.gen.ts
pnpm setup            # one-shot migrate + schema regen against a running daemon
pnpm test             # vitest
pnpm lint             # eslint
pnpm check            # prettier check
```

## Deploying to Cloudflare

The web app (SSR + `/api/rindle/*` routes) deploys to **Cloudflare Workers**, with image uploads in
**R2** via a native bucket binding. The `rindled` daemon can't run on Workers and must be hosted
separately. `pnpm deploy` builds the Worker (`CF=1 vite build`) and ships it with `wrangler`. Local
`pnpm dev`/`pnpm build` stay on Node and are unaffected. See **[`docs/DEPLOY_CLOUDFLARE.md`](docs/DEPLOY_CLOUDFLARE.md)**
for the full guide (daemon hosting, R2 setup, secrets, deploy steps).

## Commercial / hosted (optional)

Strut is fully open source and self-hostable for free. The **official hosted** Strut (marketing page +
paid **Pro** accounts via Stripe) is a **private overlay** kept out of this repo and merged in only at
deploy time — so a clone has **no billing, no marketing, and no paywall**, and behaves exactly as it does
today. This follows the same opt-in posture as the analytics above.

The repo ships the open-core **seam** (`#commercial`) that an overlay plugs into: the app *reads* an
entitlement (`server/entitlements.ts`) to lift AI caps / the deck cap / publishing, and *renders* an
optional Upgrade affordance — all inert without an overlay. `pnpm deploy` builds the free app on a single
host; `pnpm deploy:pro` builds the app **plus** the overlay as one Worker (marketing on `strut.io`, the
app on `app.strut.io`). See **[`docs/COMMERCIAL_OVERLAY.md`](docs/COMMERCIAL_OVERLAY.md)**.

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
