// The Better-Auth instance, backed by the Cloudflare D1 `DB` binding (wrangler.jsonc). See AUTH_PLAN.md
// / docs/AUTH_SETUP.md. This is the server-verified identity that will replace the spoofable `x-user`
// header (AUTH_PLAN.md Phase 3).
//
// Two runtime facts shape this file:
//   1. D1 is an OBJECT binding — reachable only via the `cloudflare:workers` module under workerd, NOT
//      process.env. We resolve it by dynamic import with a Node fallback, exactly like server/cf-env.ts's
//      R2 loader. (String secrets — BETTER_AUTH_SECRET, GITHUB_*, GOOGLE_* — DO ride process.env via
//      nodejs_compat, so those come straight off process.env.)
//   2. Better-Auth wants a FRESH instance per request on Workers (a shared one causes D1/SQLite lock
//      contention → 503s), so getAuth() builds one on each call; only the binding lookup is memoized
//      (the binding object is stable across requests).
//
// Local `pnpm dev` runs on Node with no D1 binding, so the auth endpoints require the Workers runtime
// (`pnpm preview:cf` / `wrangler dev` with a --local D1). See docs/AUTH_SETUP.md.

import { betterAuth, type BetterAuthOptions } from 'better-auth'

// Must match the d1_databases[].binding name in wrangler.jsonc.
const DB_BINDING = 'DB'

// better-auth's own database-option type. Casting the loaded binding to this keeps us from importing the
// `@cloudflare/workers-types` global D1Database, whose workerd globals shadow the DOM lib and break
// browser-side type-checking (same reasoning as cf-env.ts's R2BucketLike).
type DbOption = BetterAuthOptions['database']

let cachedDb: DbOption | null | undefined

async function loadDb(): Promise<DbOption | null> {
  if (cachedDb !== undefined) return cachedDb
  try {
    // Indirection + @vite-ignore so neither the Node SSR build nor the client bundle resolves this
    // Workers-only module at build time. Under workerd it resolves; under Node it throws → null.
    const spec = 'cloudflare:workers'
    const mod = (await import(/* @vite-ignore */ spec)) as { env?: Record<string, unknown> }
    cachedDb = (mod.env?.[DB_BINDING] as DbOption | undefined) ?? null
  } catch {
    cachedDb = null
  }
  return cachedDb
}

function req(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`[auth] missing required env: ${name}`)
  return v
}

// Only wire a provider when its credentials are present, so a spike can run with just one configured.
function resolveSocialProviders(): BetterAuthOptions['socialProviders'] {
  const p: NonNullable<BetterAuthOptions['socialProviders']> = {}
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env
  if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET)
    p.github = { clientId: GITHUB_CLIENT_ID, clientSecret: GITHUB_CLIENT_SECRET }
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET)
    p.google = { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET }
  return p
}

export async function getAuth() {
  const database = await loadDb()
  if (!database) {
    throw new Error(
      '[auth] D1 binding "DB" unavailable — run under the Workers runtime ' +
        '(pnpm preview:cf / wrangler dev with a --local D1). See docs/AUTH_SETUP.md.',
    )
  }
  const baseURL = req('BETTER_AUTH_URL')
  return betterAuth({
    database,
    secret: req('BETTER_AUTH_SECRET'),
    baseURL,
    trustedOrigins: [baseURL],
    basePath: '/api/auth', // default; explicit so the route path stays in sync
    // No passwords — social sign-in only (GitHub / Google; Apple is a fast-follow, AUTH_PLAN.md Phase 4).
    emailAndPassword: { enabled: false },
    socialProviders: resolveSocialProviders(),
    // Rate-limit on the real client IP (Cloudflare edge header), not a spoofable one.
    advanced: { ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] } },
  })
}
