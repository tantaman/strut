# Deploying Strut to Cloudflare

This deploys the **web app** (SSR + the same-origin `/api/rindle/*` API and image-upload routes) to
**Cloudflare Workers**, with image uploads stored in **Cloudflare R2** via a native bucket binding.

Local `pnpm dev` and the default `pnpm build` run on Node against the replicated topology in
`rindle.ncl`. The Cloudflare path is opt-in (`CF=1`, wired through `pnpm build:cf` / `pnpm deploy`).

---

## The one hard constraint: the data tier can't run on Workers

Rindle 0.7 uses one topology: a **`rindle-replicator` write-master** feeding one or more read-only
**`rindled` followers** behind a stable fleet edge. Workers are stateless and have no persistent
local disk or long-lived listening sockets, so **that data tier must be hosted elsewhere.**

```
                 ┌─────────────────────── Cloudflare Workers ───────────────────────┐
  browser ─────▶ │  Strut SSR app  +  /api/rindle/* (server routes)  +  R2 binding   │
     │           └───────────────┬────────────────────────────┬─────────────────────┘
     │                           │ reads / leases             │ authoritative SQL writes
     │  wss (RINDLE_FLEET_WS)    ▼                            ▼
     └────────────────▶ stable fleet edge ──▶ rindled follower    rindle-replicator
                                              read-only             write-master
```

### Hosting the Rindle topology

Use Rindle Cloud or run the topology rendered from `rindle.ncl` on persistent infrastructure. The
application tier needs three public bindings:

- `RINDLE_DAEMON_URL`: follower/fleet HTTP reads, leases, SSR reads, and materializations.
- `RINDLE_REPLICATOR_URL`: the write-master control plane and public `/v1/sql/*` surface.
- `RINDLE_FLEET_WS`: the stable browser WebSocket endpoint; follower affinity keeps its WebSocket
  and lease HTTP requests on the same follower.

The Worker also needs three server-only credentials: the follower control token, the replicator
control token, and the database SQL token. The database token is database-wide and must differ from
the private replicator control token.

> The Worker can deploy without a reachable data tier, but reads and writes will fail until all
> bindings point at a running 0.7 topology.

### Managed daemon: Rindle Cloud (headwaters)

The official deployment uses a **managed app on Rindle Cloud**. The repo is bound to it in
`.rindle/cloud.json` (committed; public identifiers only), while `rindle.ncl` describes its replicated
shape. With that binding in place:

```sh
rindle login                    # once — device flow to https://cloud.rindle.sh
pnpm rindle:deploy              # ensure/re-attach the managed app (won't provision a duplicate)
pnpm rindle:migrate:remote      # push migrations/ (Rindle schema) to the managed daemon
```

> **Forking Strut?** Before your first `rindle deploy`, `rm .rindle/cloud.json` so you provision your
> _own_ app instead of re-attaching to the official one (which you can't access). Then point the
> three Rindle URL vars in `wrangler.jsonc` at that app and install its three server credentials.
> Rindle Cloud is optional; the same `rindle.ncl` topology can be self-hosted.

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

## Runnable artifacts: sandbox origin

Runnable **artifact** blocks store the author's code as a built HTML doc in the same `STRUT_UPLOADS`
bucket (under an `artifacts/` prefix) and serve it at `GET /a/<hash>.html` with `text/html` + a strict
CSP + `nosniff` (`server/artifact.ts`). It runs in a `<iframe sandbox="allow-scripts">` — **never** with
`allow-same-origin` — so the code executes in a unique **opaque origin** and cannot read the app's
cookies/storage/DOM even if served same-origin.

For defense-in-depth, serve artifacts from a **separate origin** than the app:

1. Add a second custom domain (e.g. `sandbox.strut.io`) to **this same Worker** — append it to the
   `routes` array in `wrangler.jsonc` (`{ "pattern": "sandbox.strut.io", "custom_domain": true }`), or add
   it in the dashboard (Workers & Pages → strut → Domains & Routes). The zone must be active.
2. Set `ARTIFACT_ORIGIN` to that origin (e.g. `https://sandbox.strut.io`). Artifact `src` URLs then point
   there; `/a/<key>` answers on that host from the same Worker.

If `ARTIFACT_ORIGIN` is empty (the default, and dev), artifacts are served **same-origin** at `/a/<key>` —
still fully sandboxed (opaque origin), just without the second boundary. Apply the quota migration with
the others: `wrangler d1 migrations apply strut-auth` (adds `artifact_usage`).

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
  "RINDLE_DAEMON_URL": "https://your-read-fleet.example.com",
  "RINDLE_REPLICATOR_URL": "https://your-write-master.example.com",
  "RINDLE_FLEET_WS": "wss://your-fleet.example.com",
  "R2_PUBLIC_BASE_URL": ""
}
```

These are **runtime** config. The browser fetches `RINDLE_FLEET_WS` from `/api/rindle/config`, so a
fleet move is a vars edit + redeploy, with no client rebuild. `VITE_FLEET_WS` is the build-time
fallback; `RINDLE_DAEMON_WS` / `VITE_DAEMON_WS` are direct-follower debug bypasses only.

### 3. Set secrets (not stored in the repo)

```bash
npx wrangler secret put RINDLE_DAEMON_TOKEN     # matches the token your daemon requires
npx wrangler secret put RINDLE_REPLICATOR_TOKEN # private write/control token
npx wrangler secret put RINDLE_DATABASE_TOKEN   # public SQL bearer; distinct from the control token
```

With `nodejs_compat`, vars and secrets are surfaced on `process.env`. Never expose any of the three
tokens through `VITE_*` variables or browser routes.

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
`wrangler.jsonc` is the plugin's _source_ config, not a directly-deployable one).

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
