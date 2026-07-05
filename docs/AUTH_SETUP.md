# Auth spike — setup & run

Runnable steps for the Better-Auth + D1 spike (Phase 1 of [`../AUTH_PLAN.md`](../AUTH_PLAN.md)). Code:
`server/auth.ts`, `src/routes/api.auth.$.tsx`, `src/rindle/authClient.ts`, `src/routes/signin.tsx`,
`auth.cli.ts`, plus the `d1_databases` binding in `wrangler.jsonc`.

> Auth runs under the **Workers runtime only** (it needs the D1 binding). Plain `pnpm dev` (Node) has no
> binding, so `/api/auth/*` will 500 there by design — exercise it via `pnpm preview:cf` / `wrangler dev`.

## 1. Dependencies (already added)

`better-auth` (runtime); `@better-auth/cli`, `better-sqlite3`, `@types/better-sqlite3` (dev). The schema
generator needs better-sqlite3's native build, which pnpm defers:

```bash
pnpm approve-builds        # select better-sqlite3
```

## 2. Create the D1 database

```bash
wrangler d1 create strut-auth
```

Paste the printed `database_id` into `wrangler.jsonc` → `d1_databases[0].database_id` (currently
`REPLACE_WITH_wrangler_d1_create_OUTPUT`).

## 3. Generate the schema and apply it to D1

```bash
mkdir -p migrations-d1
npx @better-auth/cli@latest generate --config ./auth.cli.ts --output ./migrations-d1/0001_better_auth.sql

# local D1 (miniflare state, used by preview:cf / wrangler dev):
wrangler d1 execute strut-auth --local  --file=./migrations-d1/0001_better_auth.sql
# production D1:
wrangler d1 execute strut-auth --remote --file=./migrations-d1/0001_better_auth.sql
```

These are D1-native migrations in `migrations-d1/`, **separate** from the Rindle `migrations/` SQL
(that's the daemon's schema). The D1 binding's `migrations_dir` in `wrangler.jsonc` is pinned to
`migrations-d1` for exactly this reason — so `wrangler d1 migrations apply strut-auth` can never run
Rindle's schema into the auth DB. Keep the two apart.

## 4. Secrets & the auth URL

`BETTER_AUTH_URL` is a non-secret `var` in `wrangler.jsonc` (defaults to `http://localhost:3000`). **Set
it to the origin you actually open** — for `wrangler dev` that's usually `http://localhost:8787` — or the
OAuth redirect and secure cookies won't line up.

- **Production:** `wrangler secret put BETTER_AUTH_SECRET` (`openssl rand -base64 32`), plus
  `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` and/or `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
- **Local workerd:** put the same keys in `.dev.vars` (gitignored) — `wrangler dev` / the CF vite plugin
  load it:

  ```
  BETTER_AUTH_SECRET=...
  GITHUB_CLIENT_ID=...
  GITHUB_CLIENT_SECRET=...
  ```

`server/auth.ts` wires a provider **only if both its vars are present**, so you can spike with just
GitHub.

## 5. Register the OAuth app(s)

Set the callback URL to `${BETTER_AUTH_URL}/api/auth/callback/<provider>`:

- **GitHub** → Settings ▸ Developer settings ▸ OAuth Apps → `.../api/auth/callback/github`
- **Google** → Cloud Console ▸ OAuth client → redirect URI `.../api/auth/callback/google`

## 6. Run & verify

```bash
pnpm preview:cf     # CF=1 vite build + preview in workerd, with the local D1 bound
```

(or `pnpm build:cf && wrangler dev -c dist/server/wrangler.json` for the canonical workerd + local D1.)

Open `/signin`, click **Continue with GitHub** → provider consent → back to `/`. Confirm a session was
written:

```bash
wrangler d1 execute strut-auth --local --command "SELECT id, email FROM user"
```

`authClient.useSession()` on `/signin` should now show the signed-in user.

## Not wired yet (next phases, see AUTH_PLAN.md)

- **Phase 3 — the cutover.** `server/rindle-api.ts` still trusts the `x-user` header. The spike proves
  sign-in works; it does **not** yet feed the session into Rindle's principal or guard editor routes.
- Apple sign-in (Phase 4); guest → linked account (Phase 5).

## Open items to confirm

- Whether `@cloudflare/vite-plugin`'s `preview` exposes the D1 binding + local state the same way
  `wrangler dev` does. If `/api/auth/*` reports the binding missing under `preview:cf`, use the
  `wrangler dev` path in step 6.
- `BETTER_AUTH_URL` must equal the served origin (port included) for cookies/callbacks to match.
