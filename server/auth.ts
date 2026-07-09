// The Better-Auth instance. On Cloudflare it's backed by the D1 `DB` binding (wrangler.jsonc); under
// local `pnpm dev` (Node, no D1) it falls back to a local better-sqlite3 file so the guest/session flow
// works with zero extra setup. See AUTH_PLAN.md / docs/AUTH_SETUP.md. This is the server-verified
// identity that REPLACES the spoofable `x-user` header — it's the rindle principal (AUTH_PLAN Phase 3).
//
// Two runtime facts shape this file:
//   1. D1 is an OBJECT binding — reachable only via the `cloudflare:workers` module under workerd, NOT
//      process.env. We resolve it by dynamic import, exactly like server/cf-env.ts's R2 loader. When it
//      isn't there (Node dev), we open a local better-sqlite3 auth DB instead (auto-migrated from
//      migrations-d1/). The native module + node:fs are dynamic + @vite-ignore'd so they never enter the
//      workerd/client build graph. String secrets — BETTER_AUTH_SECRET, GITHUB_*, GOOGLE_* — DO ride
//      process.env via nodejs_compat. For local SQLite dev only, missing BETTER_AUTH_* values fall back
//      to deterministic localhost defaults so a fresh clone can run without a .env.
//   2. Better-Auth wants a FRESH instance per request on Workers (a shared one causes D1/SQLite lock
//      contention → 503s), so getAuth() builds one on each call; only the db lookup is memoized (both the
//      D1 binding object and the local better-sqlite3 connection are stable across requests).

import { betterAuth } from 'better-auth'
import type { BetterAuthOptions } from 'better-auth'
import { anonymous } from 'better-auth/plugins'

import { appPath } from '../shared/appPath.ts'
import { onGuestPromotion } from './claim.ts'

// Must match the d1_databases[].binding name in wrangler.jsonc.
const DB_BINDING = 'DB'

// better-auth's own database-option type. Casting the loaded binding to this keeps us from importing the
// `@cloudflare/workers-types` global D1Database, whose workerd globals shadow the DOM lib and break
// browser-side type-checking (same reasoning as cf-env.ts's R2BucketLike).
type DbOption = BetterAuthOptions['database']
interface LoadedDb {
  database: DbOption
  local: boolean
}

let cachedDb: LoadedDb | null | undefined

async function loadDb(): Promise<LoadedDb | null> {
  if (cachedDb !== undefined) return cachedDb
  try {
    // Indirection + @vite-ignore so neither the Node SSR build nor the client bundle resolves this
    // Workers-only module at build time. Under workerd it resolves; under Node it throws → sqlite.
    const spec = 'cloudflare:workers'
    const mod = (await import(/* @vite-ignore */ spec)) as {
      env?: Record<string, unknown>
    }
    const binding = mod.env?.[DB_BINDING] as DbOption | undefined
    if (binding) {
      cachedDb = { database: binding, local: false }
      return cachedDb
    }
  } catch {
    // not under workerd — fall through to the local sqlite dev DB
  }
  cachedDb = { database: await loadLocalSqlite(), local: true }
  return cachedDb
}

// The subsets of the better-sqlite3 Database + node fs/path surfaces we touch — typed structurally so
// we never pull the native module's or node's types into the shared build graph.
interface LocalDb {
  exec: (sql: string) => unknown
  pragma: (source: string) => unknown
  prepare: (sql: string) => {
    all: (...params: unknown[]) => Array<Record<string, unknown>>
    run: (...params: unknown[]) => unknown
  }
}
interface FsLike {
  readdirSync: (dir: string) => string[]
  readFileSync: (path: string, encoding: 'utf8') => string
}
interface PathLike {
  join: (...parts: string[]) => string
}

// A local better-sqlite3 auth DB for `pnpm dev` (Node, no D1). Dynamic + @vite-ignore (with a string
// indirection so static analysis can't see the specifier) keeps the native module and node:fs out of
// the workerd/client build graph — this branch only ever runs under Node.
async function loadLocalSqlite(): Promise<DbOption> {
  const sqliteSpec = 'better-sqlite3'
  const fsSpec = 'node:fs'
  const pathSpec = 'node:path'
  const { default: Database } = (await import(
    /* @vite-ignore */ sqliteSpec
  )) as {
    default: new (path: string) => LocalDb
  }
  const fs = (await import(/* @vite-ignore */ fsSpec)) as FsLike
  const path = (await import(/* @vite-ignore */ pathSpec)) as PathLike

  const file = process.env.STRUT_AUTH_DB ?? path.join(process.cwd(), 'auth.db')
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  migrateLocalAuth(db, fs, path)
  return db as DbOption
}

// Apply migrations-d1/*.sql to the local dev auth DB once each (tracked in _auth_migrations), so dev
// stays in lockstep with the SAME schema source of truth D1 uses (`wrangler d1 migrations apply`) — no
// drift. Idempotent across restarts.
function migrateLocalAuth(db: LocalDb, fs: FsLike, path: PathLike): void {
  db.exec(
    'create table if not exists _auth_migrations (name text primary key, applied_at text not null)',
  )
  const dir = path.join(process.cwd(), 'migrations-d1')
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
  const done = new Set(
    db
      .prepare('select name from _auth_migrations')
      .all()
      .map((r) => String(r.name)),
  )
  for (const f of files) {
    if (done.has(f)) continue
    db.exec(fs.readFileSync(path.join(dir, f), 'utf8'))
    db.prepare(
      'insert into _auth_migrations (name, applied_at) values (?, ?)',
    ).run(f, new Date().toISOString())
  }
}

const LOCAL_AUTH_URL = 'http://localhost:3000'
const LOCAL_AUTH_SECRET = 'strut-local-dev-secret-not-for-production-change-me'

function req(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`[auth] missing required env: ${name}`)
  return v
}

function requestOrigin(request: Request | undefined): string | null {
  if (!request) return null
  try {
    return new URL(request.url).origin
  } catch {
    return null
  }
}

function localOrRequired(
  name: string,
  local: boolean,
  fallback: string,
): string {
  const v = process.env[name]
  if (v) return v
  if (local) return fallback
  return req(name)
}

// Only wire a provider when its credentials are present, so a spike can run with just one configured.
function resolveSocialProviders(): BetterAuthOptions['socialProviders'] {
  const p: NonNullable<BetterAuthOptions['socialProviders']> = {}
  const {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
  } = process.env
  if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET)
    p.github = {
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
    }
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET)
    p.google = {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }
  return p
}

export async function getAuth(request?: Request) {
  const loaded = await loadDb()
  if (!loaded) {
    throw new Error(
      '[auth] D1 binding "DB" unavailable — run under the Workers runtime ' +
        '(pnpm preview:cf / wrangler dev with a --local D1). See docs/AUTH_SETUP.md.',
    )
  }
  const origin = requestOrigin(request)
  const baseURL = localOrRequired(
    'BETTER_AUTH_URL',
    loaded.local,
    origin ?? LOCAL_AUTH_URL,
  )
  // Optional cross-origin support for non-standard deploys. Both are unset by default → single-host
  // behavior, identical to before:
  //   AUTH_TRUSTED_ORIGINS — extra comma-separated origins to trust (e.g. the marketing apex) beyond baseURL.
  //   AUTH_COOKIE_DOMAIN   — a parent cookie domain (e.g. ".strut.io") to share the session across
  //                          subdomains, so a checkout initiated from marketing knows the signed-in user.
  const extraOrigins = (process.env.AUTH_TRUSTED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const cookieDomain = process.env.AUTH_COOKIE_DOMAIN?.trim()
  const trustedOrigins = Array.from(
    new Set([baseURL, origin, ...extraOrigins].filter((v): v is string => !!v)),
  )
  return betterAuth({
    database: loaded.database,
    secret: localOrRequired(
      'BETTER_AUTH_SECRET',
      loaded.local,
      LOCAL_AUTH_SECRET,
    ),
    baseURL,
    trustedOrigins,
    basePath: appPath('/api/auth'), // follows the router mount path; /app/api/auth in commercial builds
    // No passwords — social sign-in only (GitHub / Google; Apple is a fast-follow, AUTH_PLAN.md Phase 4).
    emailAndPassword: { enabled: false },
    socialProviders: resolveSocialProviders(),
    advanced: {
      // Rate-limit on the real client IP (Cloudflare edge header), not a spoofable one.
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] },
      // Share the session cookie across subdomains only when a parent domain is configured.
      ...(cookieDomain
        ? { crossSubDomainCookies: { enabled: true, domain: cookieDomain } }
        : {}),
    },
    // Guest-first identity: the first visit mints a server-signed anonymous session (the rindle
    // principal), so the SSR loader can seed first paint and there's no sign-in wall. Promoting to a
    // real GitHub/Google account fires onGuestPromotion, which reassigns the guest's in-progress decks
    // to the new account so nothing is lost. (See strut-auth-guest-first / AUTH_PLAN Phase 5.)
    plugins: [anonymous({ onLinkAccount: onGuestPromotion })],
  })
}
