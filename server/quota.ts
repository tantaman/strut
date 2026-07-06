// Durable per-user daily quota for "✨ AI Arrange". The app pays for Workers AI inference, so this is the
// AUTHORITATIVE cost ceiling: at most ARRANGE_DAILY_LIMIT allowed calls per user per UTC day, counted in
// the auth D1 (the `DB` binding — same store as Better-Auth, NOT Rindle). The route's in-memory throttle
// is only a cheap burst pre-filter; THIS survives isolate recycling and spans every isolate.
//
// Runtime access mirrors server/auth.ts: under workerd the `DB` binding is an OBJECT binding reached via
// the `cloudflare:workers` module (not process.env); under `pnpm dev` (Node, no D1) we open the same
// local better-sqlite3 auth.db. The `arrange_usage` table is created there by auth's migrateLocalAuth
// running migrations-d1/*.sql, and in prod by `wrangler d1 migrations apply strut-auth`. The native
// module is dynamically imported + @vite-ignore'd (string-indirected) so it never enters the
// workerd/client build graph.

export const ARRANGE_DAILY_LIMIT = 50

/** UTC calendar-day key (YYYY-MM-DD) for a timestamp — the quota window. */
export function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10)
}

/** The minimal store the quota needs: atomically bump a (user, day) counter and return the new value,
 *  refund one on a failed call, and sweep stale rows. Backed by D1 (workerd) or better-sqlite3 (dev). */
export interface QuotaStore {
  bump: (userId: string, day: string) => Promise<number>
  refund: (userId: string, day: string) => Promise<void>
  sweep: (before: string) => Promise<void>
}

// One atomic upsert does the enforcement: insert-or-increment and return the NEW count in a single
// statement, so concurrent calls can't race past the limit. RETURNING is supported by both D1 (SQLite)
// and better-sqlite3.
const BUMP_SQL =
  'INSERT INTO arrange_usage (user_id, day, count) VALUES (?, ?, 1) ' +
  'ON CONFLICT(user_id, day) DO UPDATE SET count = count + 1 RETURNING count'
const REFUND_SQL =
  'UPDATE arrange_usage SET count = count - 1 WHERE user_id = ? AND day = ? AND count > 0'
const SWEEP_SQL = 'DELETE FROM arrange_usage WHERE day < ?'

export interface QuotaResult {
  allowed: boolean
  used: number
  limit: number
}

/** Atomically consume one unit of the caller's daily quota. `allowed` is false once the (post-increment)
 *  count exceeds the limit — the increment is unconditional so it can't be raced past; a rejected attempt
 *  just over-counts harmlessly and must NOT proceed to spend inference. Opportunistically prunes rows from
 *  earlier days on the first call of a new day. */
export async function consumeArrangeQuota(
  userId: string,
  now: number,
  store?: QuotaStore,
): Promise<QuotaResult> {
  const s = store ?? (await getStore())
  const day = utcDay(now)
  const used = await s.bump(userId, day)
  if (used === 1) {
    // First call today for this user — a cheap moment to prune rows older than a couple of days.
    void s.sweep(utcDay(now - 3 * 86_400_000)).catch(() => {})
  }
  return {
    allowed: used <= ARRANGE_DAILY_LIMIT,
    used,
    limit: ARRANGE_DAILY_LIMIT,
  }
}

/** Give back one unit — call when an allowed request then FAILS (e.g. the model was unavailable) so the
 *  user isn't charged quota for work that didn't happen. Floors at 0. Best-effort. */
export async function refundArrangeQuota(
  userId: string,
  now: number,
  store?: QuotaStore,
): Promise<void> {
  const s = store ?? (await getStore())
  await s.refund(userId, utcDay(now))
}

// ---- store construction ----

// Subset of the D1 prepared-statement surface we touch (structural — avoids importing
// @cloudflare/workers-types, whose globals shadow the DOM lib; same reasoning as server/auth.ts).
interface D1Like {
  prepare: (sql: string) => {
    bind: (...args: unknown[]) => {
      first: <T>() => Promise<T | null>
      run: () => Promise<unknown>
    }
  }
}

export function makeD1Store(db: D1Like): QuotaStore {
  return {
    bump: async (userId, day) => {
      const row = await db
        .prepare(BUMP_SQL)
        .bind(userId, day)
        .first<{ count: number }>()
      return row?.count ?? 1
    },
    refund: async (userId, day) => {
      await db.prepare(REFUND_SQL).bind(userId, day).run()
    },
    sweep: async (before) => {
      await db.prepare(SWEEP_SQL).bind(before).run()
    },
  }
}

// Subset of better-sqlite3 we touch (structural — keeps the native module's types out of the build graph).
interface LocalDb {
  prepare: (sql: string) => {
    get: (...params: unknown[]) => Record<string, unknown> | undefined
    run: (...params: unknown[]) => unknown
  }
}

export function makeSqliteStore(db: LocalDb): QuotaStore {
  return {
    bump: async (userId, day) => {
      const row = db.prepare(BUMP_SQL).get(userId, day) as
        | { count?: number }
        | undefined
      return typeof row?.count === 'number' ? row.count : 1
    },
    refund: async (userId, day) => {
      db.prepare(REFUND_SQL).run(userId, day)
    },
    sweep: async (before) => {
      db.prepare(SWEEP_SQL).run(before)
    },
  }
}

let cachedStore: QuotaStore | undefined
async function getStore(): Promise<QuotaStore> {
  if (cachedStore) return cachedStore
  try {
    const spec = 'cloudflare:workers'
    const mod = (await import(/* @vite-ignore */ spec)) as {
      env?: Record<string, unknown>
    }
    const d1 = mod.env?.DB
    if (d1) {
      cachedStore = makeD1Store(d1 as D1Like)
      return cachedStore
    }
  } catch {
    // not under workerd — fall through to the local sqlite dev DB
  }
  cachedStore = makeSqliteStore(await loadLocalSqlite())
  return cachedStore
}

// Open the SAME local auth.db as server/auth.ts (dev only). A second WAL connection to the file is fine;
// the table is created by auth's migrateLocalAuth. String-indirected + @vite-ignore keeps better-sqlite3
// out of the workerd/client build graph — this branch only runs under Node.
async function loadLocalSqlite(): Promise<LocalDb> {
  const sqliteSpec = 'better-sqlite3'
  const { default: Database } = (await import(
    /* @vite-ignore */ sqliteSpec
  )) as {
    default: new (path: string) => LocalDb & { pragma: (s: string) => unknown }
  }
  const file = process.env.STRUT_AUTH_DB ?? `${process.cwd()}/auth.db`
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  return db
}
