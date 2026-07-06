// Durable per-user daily quotas for the AI features that spend Workers AI inference (the app pays). This
// is the AUTHORITATIVE cost ceiling: at most N allowed calls per user per UTC day, counted in the auth D1
// (the `DB` binding — same store as Better-Auth, NOT Rindle). The routes' in-memory throttles are only
// cheap burst pre-filters; THIS survives isolate recycling and spans every isolate.
//
// Three features, three independent buckets (three tables, same shape): `arrange_usage` (✨ Arrange),
// `generate_usage` (✨ Generate slides — heavier, so a smaller limit), and `chat_usage` (✨ Chat — metered
// one unit per user turn; turns are cheap but conversations are many, so a larger limit). The store logic
// is identical and table-parameterized; the feature wrappers below pick the table + limit.
//
// Runtime access mirrors server/auth.ts: under workerd the `DB` binding is an OBJECT binding reached via
// the `cloudflare:workers` module (not process.env); under `pnpm dev` (Node, no D1) we open the same
// local better-sqlite3 auth.db. The tables are created there by auth's migrateLocalAuth running
// migrations-d1/*.sql, and in prod by `wrangler d1 migrations apply strut-auth`. The native module is
// dynamically imported + @vite-ignore'd (string-indirected) so it never enters the workerd/client build
// graph.

// The usage tables (names are internal constants, never user input — safe to interpolate into SQL).
const ARRANGE_TABLE = 'arrange_usage'
const GENERATE_TABLE = 'generate_usage'
const CHAT_TABLE = 'chat_usage'

export const ARRANGE_DAILY_LIMIT = 50
// Generating a whole batch of slides is a bigger call than a single arrange, so it gets a smaller cap.
export const GENERATE_DAILY_LIMIT = 20
// Chat is metered ONE unit per user turn — individually cheap, but a conversation is many turns — so it
// gets the largest daily cap.
export const CHAT_DAILY_LIMIT = 200

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
const bumpSql = (table: string) =>
  `INSERT INTO ${table} (user_id, day, count) VALUES (?, ?, 1) ` +
  'ON CONFLICT(user_id, day) DO UPDATE SET count = count + 1 RETURNING count'
const refundSql = (table: string) =>
  `UPDATE ${table} SET count = count - 1 WHERE user_id = ? AND day = ? AND count > 0`
const sweepSql = (table: string) => `DELETE FROM ${table} WHERE day < ?`

export interface QuotaResult {
  allowed: boolean
  used: number
  limit: number
}

/** Atomically consume one unit of a daily quota for `table`. `allowed` is false once the (post-increment)
 *  count exceeds `limit` — the increment is unconditional so it can't be raced past; a rejected attempt
 *  just over-counts harmlessly and must NOT proceed to spend inference. Opportunistically prunes rows from
 *  earlier days on the first call of a new day. */
async function consumeQuota(
  userId: string,
  now: number,
  limit: number,
  table: string,
  store?: QuotaStore,
): Promise<QuotaResult> {
  const s = store ?? (await getStore(table))
  const day = utcDay(now)
  const used = await s.bump(userId, day)
  if (used === 1) {
    // First call today for this user — a cheap moment to prune rows older than a couple of days.
    void s.sweep(utcDay(now - 3 * 86_400_000)).catch(() => {})
  }
  return { allowed: used <= limit, used, limit }
}

/** Give back one unit — call when an allowed request then FAILS (e.g. the model was unavailable) so the
 *  user isn't charged quota for work that didn't happen. Floors at 0. Best-effort. */
async function refundQuota(
  userId: string,
  now: number,
  table: string,
  store?: QuotaStore,
): Promise<void> {
  const s = store ?? (await getStore(table))
  await s.refund(userId, utcDay(now))
}

// ---- feature wrappers ----

export function consumeArrangeQuota(
  userId: string,
  now: number,
  store?: QuotaStore,
): Promise<QuotaResult> {
  return consumeQuota(userId, now, ARRANGE_DAILY_LIMIT, ARRANGE_TABLE, store)
}
export function refundArrangeQuota(
  userId: string,
  now: number,
  store?: QuotaStore,
): Promise<void> {
  return refundQuota(userId, now, ARRANGE_TABLE, store)
}

export function consumeGenerateQuota(
  userId: string,
  now: number,
  store?: QuotaStore,
): Promise<QuotaResult> {
  return consumeQuota(userId, now, GENERATE_DAILY_LIMIT, GENERATE_TABLE, store)
}
export function refundGenerateQuota(
  userId: string,
  now: number,
  store?: QuotaStore,
): Promise<void> {
  return refundQuota(userId, now, GENERATE_TABLE, store)
}

export function consumeChatQuota(
  userId: string,
  now: number,
  store?: QuotaStore,
): Promise<QuotaResult> {
  return consumeQuota(userId, now, CHAT_DAILY_LIMIT, CHAT_TABLE, store)
}
export function refundChatQuota(
  userId: string,
  now: number,
  store?: QuotaStore,
): Promise<void> {
  return refundQuota(userId, now, CHAT_TABLE, store)
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

export function makeD1Store(db: D1Like, table = ARRANGE_TABLE): QuotaStore {
  return {
    bump: async (userId, day) => {
      const row = await db
        .prepare(bumpSql(table))
        .bind(userId, day)
        .first<{ count: number }>()
      return row?.count ?? 1
    },
    refund: async (userId, day) => {
      await db.prepare(refundSql(table)).bind(userId, day).run()
    },
    sweep: async (before) => {
      await db.prepare(sweepSql(table)).bind(before).run()
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

export function makeSqliteStore(db: LocalDb, table = ARRANGE_TABLE): QuotaStore {
  return {
    bump: async (userId, day) => {
      const row = db.prepare(bumpSql(table)).get(userId, day) as
        | { count?: number }
        | undefined
      return typeof row?.count === 'number' ? row.count : 1
    },
    refund: async (userId, day) => {
      db.prepare(refundSql(table)).run(userId, day)
    },
    sweep: async (before) => {
      db.prepare(sweepSql(table)).run(before)
    },
  }
}

// One store per table (each resolves the same DB binding but targets its own usage table).
const cachedStores = new Map<string, QuotaStore>()
async function getStore(table: string): Promise<QuotaStore> {
  const cached = cachedStores.get(table)
  if (cached) return cached
  try {
    const spec = 'cloudflare:workers'
    const mod = (await import(/* @vite-ignore */ spec)) as {
      env?: Record<string, unknown>
    }
    const d1 = mod.env?.DB
    if (d1) {
      const store = makeD1Store(d1 as D1Like, table)
      cachedStores.set(table, store)
      return store
    }
  } catch {
    // not under workerd — fall through to the local sqlite dev DB
  }
  const store = makeSqliteStore(await loadLocalSqlite(), table)
  cachedStores.set(table, store)
  return store
}

// Open the SAME local auth.db as server/auth.ts (dev only). A second WAL connection to the file is fine;
// the tables are created by auth's migrateLocalAuth. String-indirected + @vite-ignore keeps better-sqlite3
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
