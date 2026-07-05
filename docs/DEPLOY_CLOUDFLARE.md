# Deploying Strut to Cloudflare

This deploys the **web app** (SSR + the same-origin `/api/rindle/*` API and image-upload routes) to
**Cloudflare Workers**, with image uploads stored in **Cloudflare R2** via a native bucket binding.

Local `pnpm dev` and the default `pnpm build` are unchanged — they still run on Node against a local
`rindled` daemon. The Cloudflare path is opt-in (`CF=1`, wired through `pnpm build:cf` / `pnpm deploy`).

---

## The one hard constraint: the daemon can't run on Workers

Strut's data layer is the **`rindled` daemon** — it owns the SQLite database (`rindle.db`) and the
live-query **WebSocket**. Workers are stateless and have no persistent local disk or long-lived
listening sockets, so **the daemon must be hosted somewhere else.** The Worker (and the browser) talk
to it over the network:

```
                 ┌─────────────────────── Cloudflare Workers ───────────────────────┐
  browser ─────▶ │  Strut SSR app  +  /api/rindle/* (server routes)  +  R2 binding   │
     │           └───────────────┬──────────────────────────────────────────────────┘
     │                           │  https  (RINDLE_DAEMON_URL, Bearer RINDLE_DAEMON_TOKEN)
     │  wss (VITE_RINDLE_WS)     ▼
     └────────────────▶ ┌──────────────────────────────┐
                        │  rindled daemon (host it!)   │  SQLite + live-query WebSocket
                        │  :7600 control  :7601 ws     │  needs a persistent volume
                        └──────────────────────────────┘
```

### Hosting the daemon

Run `rindled` on any host that gives you a **persistent volume** and lets you terminate **TLS** — a
small VM/VPS, Fly.io, Railway, Render, a container platform, etc. Requirements:

- Persistent disk for `rindle.db` (and its `-wal`/`-shm` files).
- Bind to a reachable interface, not just loopback. `daemon.json` ships with `"bindHost":
  "127.0.0.1"`; change it (e.g. `0.0.0.0`) **and put it behind a TLS-terminating reverse proxy** so
  only `https`/`wss` is exposed publicly.
- Set an auth token so the control plane isn't open to the world (the Worker sends
  `Authorization: Bearer <RINDLE_DAEMON_TOKEN>`; see the rindle daemon docs for enabling token auth).
- Expose two public endpoints:
  - the **control plane** (`:7600`) as `https://…` → used by the Worker as `RINDLE_DAEMON_URL`
  - the **live-query WebSocket** (`:7601`) as `wss://…` → used by the browser as `VITE_RINDLE_WS`

> If you don't want to operate a daemon yet, deploy the Worker anyway — it serves and builds fine —
> but reads/writes will fail until `RINDLE_DAEMON_URL` points at a running daemon.

---

## Image storage: three backends, auto-selected

`server/upload.ts` picks a storage backend at runtime, in priority order:

1. **Native R2 binding** — used when running on Workers (`env.STRUT_UPLOADS`). No credentials needed.
   **This is the production path on Cloudflare.**
2. **R2 over the S3 API** — used on a non-Workers host when the `R2_*` credential env vars are set.
3. **Local disk** (`.uploads/`) — the zero-config dev fallback.

The binding is read through `server/cf-env.ts`, which imports `env` from `cloudflare:workers` only at
runtime and returns `null` off-Workers — so the same code runs in all three environments.

**Public URL vs. Worker-served:** after storing an object, the returned image URL is either

- `${R2_PUBLIC_BASE_URL}/<key>` when `R2_PUBLIC_BASE_URL` is set (a public r2.dev domain or a custom
  domain — cheapest + CDN-cached), **or**
- `/api/rindle/uploads/<key>` when it's empty — the image is streamed back through the Worker from the
  bucket, so a **private bucket works with no extra setup** (at the cost of a Worker request per load).

---

## One-time setup

### 1. Create the R2 bucket

```bash
npx wrangler r2 bucket create strut-uploads
```

The binding is already declared in `wrangler.jsonc`:

```jsonc
"r2_buckets": [{ "binding": "STRUT_UPLOADS", "bucket_name": "strut-uploads" }]
```

(Optional) For direct CDN URLs, enable public access / attach a custom domain to the bucket and set
`R2_PUBLIC_BASE_URL` (see below). Otherwise leave it empty and images are served through the Worker.

### 2. Set config in `wrangler.jsonc` (`vars`)

Edit the `vars` block:

```jsonc
"vars": {
  "RINDLE_DAEMON_URL": "https://your-daemon-host.example.com",  // your hosted daemon control plane
  "R2_PUBLIC_BASE_URL": ""                                       // "" = serve via Worker; or https://pub-xxxx.r2.dev
}
```

### 3. Set secrets (not stored in the repo)

```bash
npx wrangler secret put RINDLE_DAEMON_TOKEN     # matches the token your daemon requires
```

With `nodejs_compat`, both `vars` and secrets are surfaced on `process.env` at runtime, so
`server/rindle-api.ts` keeps reading `process.env.RINDLE_DAEMON_URL` / `RINDLE_DAEMON_TOKEN` unchanged.

### 4. Point the browser at the daemon WebSocket (build-time)

`VITE_RINDLE_WS` is baked into the **client** bundle at build time (it's a `VITE_`-prefixed var), so it
must be set when you build for production:

```bash
VITE_RINDLE_WS="wss://your-daemon-host.example.com/ws" pnpm deploy
```

or put it in `.env` (loaded by `vite.config.ts`). Without it the client falls back to
`ws://127.0.0.1:7601`, which won't work in production.

---

## Deploy

```bash
pnpm cf-typegen     # (optional) regenerate worker-configuration.d.ts for binding autocomplete
pnpm preview:cf     # (optional) build + preview the Worker locally in workerd before deploying
pnpm deploy         # CF=1 vite build && wrangler deploy -c dist/server/wrangler.json
```

`CF=1 vite build` runs the app through `@cloudflare/vite-plugin`, producing the Worker at
`dist/server/index.js`, static assets at `dist/client/`, and the deployable config at
`dist/server/wrangler.json` (this is why `deploy` passes `-c dist/server/wrangler.json` — the root
`wrangler.jsonc` is the plugin's *source* config, not a directly-deployable one).

### Scripts

| Script            | What it does                                                        |
| ----------------- | ------------------------------------------------------------------- |
| `pnpm dev`        | Local Node dev (daemon + Vite). **Unchanged — no Cloudflare.**      |
| `pnpm build`      | Default Node build. **Unchanged.**                                  |
| `pnpm build:cf`   | `CF=1 vite build` — build the Cloudflare Worker bundle.             |
| `pnpm preview:cf` | Build, then preview the Worker locally in workerd (`vite preview`). |
| `pnpm deploy`     | Build the Worker and `wrangler deploy` the generated config.        |
| `pnpm cf-typegen` | `wrangler types` — regenerate binding types (gitignored).           |

---

## Notes & gotchas

- **`worker-configuration.d.ts` is gitignored and excluded from `tsconfig.json`.** Its workerd runtime
  globals shadow the DOM lib and break browser-side type-checking (e.g. `Response.json()`), so the two
  server files that need R2 types use a small local interface (`R2BucketLike` in `server/cf-env.ts`)
  instead. Run `pnpm cf-typegen` if you want full binding autocomplete while editing Worker code.
- **`compatibility_date`** in `wrangler.jsonc` is pinned to `2026-07-01` to match the installed
  `workerd`; bump it as you update `wrangler`/`workerd`.
- The AWS S3 SDK is imported lazily and only on the S3-fallback path; it bundles for Workers but is
  never invoked there (the native binding wins), so no R2 credentials are needed on Cloudflare.
