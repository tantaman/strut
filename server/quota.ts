// Durable per-user daily quotas for the AI features that spend Workers AI inference (the app pays). This
// is the AUTHORITATIVE cost ceiling: at most N allowed calls per user per UTC day, counted in the auth D1
// (the `DB` binding — same store as Better-Auth, NOT Rindle). The routes' in-memory throttles are only
// cheap burst pre-filters; THIS survives isolate recycling and spans every isolate.
//
// Each feature has an independent daily bucket (same table shape); paid plans may instead route selected
// inference features through one pooled monthly allowance. The store logic is identical and
// table-parameterized; the feature wrappers below pick the table + limit.
//
// Runtime access mirrors server/auth.ts: under workerd the `DB` binding is an OBJECT binding reached via
// the `cloudflare:workers` module (not process.env); under `pnpm dev` (Node, no D1) we open the same
// local better-sqlite3 auth.db. The tables are created there by auth's migrateLocalAuth running
// migrations-d1/*.sql, and in prod by `wrangler d1 migrations apply strut-auth`. The native module is
// dynamically imported + @vite-ignore'd (string-indirected) so it never enters the workerd/client build
// graph.

import type { AiFeature } from '../shared/commercial.ts'

// The usage tables (names are internal constants, never user input — safe to interpolate into SQL).
const ARRANGE_TABLE = 'arrange_usage'
const GENERATE_TABLE = 'generate_usage'
const CHAT_TABLE = 'chat_usage'
// Artifacts don't spend inference — the ceiling is R2 storage / abuse, not model cost — so it's a
// GENEROUS cap: uploads are user-initiated "Run/Update" clicks, and identical code dedupes (content-
// addressed keys), so this only bites a runaway script.
const ARTIFACT_TABLE = 'artifact_usage'
// Text-to-image generation is a heavy Workers AI call (the app pays), so it gets its own small bucket —
// separate from generate so a batch of images can't drain the slide-generation allowance and vice versa.
const IMAGE_TABLE = 'image_usage'
// "🎙️ From a recording": speech-to-text (Whisper) and transcript→deck are each heavy Workers AI calls, so
// each gets its own small bucket. transcribe is the audio precursor; narrate authors the deck (and, on a
// pooled plan, counts as one pooled AI message — see POOLED_FEATURES in server/entitlements.ts).
const TRANSCRIBE_TABLE = 'transcribe_usage'
const NARRATE_TABLE = 'narrate_usage'
// The POOLED monthly allowance (paid plans): ONE counter shared across the inference features
// (arrange/generate/chat/image/narrate — see aiMetering's POOLED_FEATURES), keyed by (user, MONTH) instead of
// (user, day). Same table shape + store logic as the daily buckets; the `day` column just holds a
// `YYYY-MM` month key here (see migrations-d1/0009_ai_pool_usage.sql).
const POOL_TABLE = 'ai_pool_usage'

export const ARRANGE_DAILY_LIMIT = 50
// Generating a whole batch of slides is a bigger call than a single arrange, so it gets a smaller cap.
export const GENERATE_DAILY_LIMIT = 20
// Chat is metered ONE unit per user turn — individually cheap, but a conversation is many turns — so it
// gets the largest daily cap.
export const CHAT_DAILY_LIMIT = 200
export const ARTIFACT_DAILY_LIMIT = 200
// Generating an image is heavy; keep the daily allowance modest (mirrors generate).
export const IMAGE_DAILY_LIMIT = 20
// Transcribing audio and authoring a deck from a transcript are both heavy; keep their free-tier daily
// allowances modest (a recording→deck run costs one of each).
export const TRANSCRIBE_DAILY_LIMIT = 10
export const NARRATE_DAILY_LIMIT = 10
// Fallback for the pooled monthly allowance if a plan somehow sets a pool without a number (aiMetering only
// ever returns a concrete limit for the month window, so this is a safety net, not a real cap).
export const MONTHLY_POOL_LIMIT = 1000

/** UTC calendar-day key (YYYY-MM-DD) for a timestamp — the daily quota window. */
export function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10)
}

/** UTC calendar-month key (YYYY-MM) for a timestamp — the pooled-allowance window. Lexical order matches
 *  chronological order, so the sweep's `day < ?` prune works on month keys too. */
export function utcMonth(now: number): string {
  return new Date(now).toISOString().slice(0, 7)
}

// Feature → its usage table + default (free-tier) daily limit, so the usage meter can read every bucket
// without restating the wiring. peekUsage reads today's count without incrementing.
const FEATURE_TABLE: Record<AiFeature, string> = {
  arrange: ARRANGE_TABLE,
  generate: GENERATE_TABLE,
  chat: CHAT_TABLE,
  image: IMAGE_TABLE,
  artifact: ARTIFACT_TABLE,
  transcribe: TRANSCRIBE_TABLE,
  narrate: NARRATE_TABLE,
}
export const FEATURE_DEFAULT_LIMIT: Record<AiFeature, number> = {
  arrange: ARRANGE_DAILY_LIMIT,
  generate: GENERATE_DAILY_LIMIT,
  chat: CHAT_DAILY_LIMIT,
  image: IMAGE_DAILY_LIMIT,
  artifact: ARTIFACT_DAILY_LIMIT,
  transcribe: TRANSCRIBE_DAILY_LIMIT,
  narrate: NARRATE_DAILY_LIMIT,
}

/** Today's consumed count for a feature (no increment) — the read behind /api/usage. */
export async function peekUsage(
  userId: string,
  now: number,
  feature: AiFeature,
  store?: QuotaStore,
): Promise<number> {
  const s = store ?? (await getStore(FEATURE_TABLE[feature]))
  return s.peek(userId, utcDay(now))
}

/** The minimal store the quota needs: atomically bump a (user, day) counter and return the new value,
 *  refund one on a failed call, and sweep stale rows. Backed by D1 (workerd) or better-sqlite3 (dev). */
export interface QuotaStore {
  bump: (userId: string, day: string) => Promise<number>
  refund: (userId: string, day: string) => Promise<void>
  sweep: (before: string) => Promise<void>
  /** Read today's count WITHOUT incrementing (for the usage meter). 0 when there's no row. */
  peek: (userId: string, day: string) => Promise<number>
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
const peekSql = (table: string) =>
  `SELECT count FROM ${table} WHERE user_id = ? AND day = ?`

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
  // Entitlement override (Pro raises the ceiling); defaults to the app's free-tier cap.
  limit: number = ARRANGE_DAILY_LIMIT,
): Promise<QuotaResult> {
  return consumeQuota(userId, now, limit, ARRANGE_TABLE, store)
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
  limit: number = GENERATE_DAILY_LIMIT,
): Promise<QuotaResult> {
  return consumeQuota(userId, now, limit, GENERATE_TABLE, store)
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
  limit: number = CHAT_DAILY_LIMIT,
): Promise<QuotaResult> {
  return consumeQuota(userId, now, limit, CHAT_TABLE, store)
}
export function refundChatQuota(
  userId: string,
  now: number,
  store?: QuotaStore,
): Promise<void> {
  return refundQuota(userId, now, CHAT_TABLE, store)
}

export function consumeArtifactQuota(
  userId: string,
  now: number,
  store?: QuotaStore,
  limit: number = ARTIFACT_DAILY_LIMIT,
): Promise<QuotaResult> {
  return consumeQuota(userId, now, limit, ARTIFACT_TABLE, store)
}
export function refundArtifactQuota(
  userId: string,
  now: number,
  store?: QuotaStore,
): Promise<void> {
  return refundQuota(userId, now, ARTIFACT_TABLE, store)
}

export function consumeImageQuota(
  userId: string,
  now: number,
  store?: QuotaStore,
  limit: number = IMAGE_DAILY_LIMIT,
): Promise<QuotaResult> {
  return consumeQuota(userId, now, limit, IMAGE_TABLE, store)
}
export function refundImageQuota(
  userId: string,
  now: number,
  store?: QuotaStore,
): Promise<void> {
  return refundQuota(userId, now, IMAGE_TABLE, store)
}

// ---- pooled monthly allowance ----

// The pooled counterparts of consumeQuota/refundQuota: same atomic upsert-increment enforcement, but keyed
// by MONTH (utcMonth) into the single POOL_TABLE. Any pooled inference feature
// (arrange/generate/chat/image/narrate) bumps the same row, so N calls across features share one N/limit
// allowance for the calendar month.
async function consumePool(
  userId: string,
  now: number,
  limit: number,
  store?: QuotaStore,
): Promise<QuotaResult> {
  const s = store ?? (await getStore(POOL_TABLE))
  const month = utcMonth(now)
  const used = await s.bump(userId, month)
  if (used === 1) {
    // First call this month for this user — prune every prior-month row (day < this month).
    void s.sweep(month).catch(() => {})
  }
  return { allowed: used <= limit, used, limit }
}
async function refundPool(
  userId: string,
  now: number,
  store?: QuotaStore,
): Promise<void> {
  const s = store ?? (await getStore(POOL_TABLE))
  await s.refund(userId, utcMonth(now))
}

/** This month's pooled consumption (no increment) — the read behind /api/usage for a pooled plan. */
export async function peekPool(
  userId: string,
  now: number,
  store?: QuotaStore,
): Promise<number> {
  const s = store ?? (await getStore(POOL_TABLE))
  return s.peek(userId, utcMonth(now))
}

// ---- unified dispatch (routes call these) ----

export type MeteredWindow = 'day' | 'month'

/** Consume one unit for `feature` against whichever window the plan uses. `metering` is the object
 *  aiMetering returns for a metered plan — `window: 'month'` routes to the shared pool, `window: 'day'`
 *  routes to the feature's own daily bucket (falling back to its built-in default when `limit` is
 *  undefined). The returned `window` lets the route phrase the right "reached your limit" message. */
export async function consumeAiQuota(
  userId: string,
  now: number,
  feature: AiFeature,
  metering: { window: MeteredWindow; limit: number | undefined },
  store?: QuotaStore,
): Promise<QuotaResult & { window: MeteredWindow }> {
  if (metering.window === 'month') {
    const r = await consumePool(
      userId,
      now,
      metering.limit ?? MONTHLY_POOL_LIMIT,
      store,
    )
    return { ...r, window: 'month' }
  }
  const limit = metering.limit ?? FEATURE_DEFAULT_LIMIT[feature]
  const r = await consumeQuota(
    userId,
    now,
    limit,
    FEATURE_TABLE[feature],
    store,
  )
  return { ...r, window: 'day' }
}

/** Give back one unit on a failed call, on the same window `consumeAiQuota` charged. Best-effort. */
export async function refundAiQuota(
  userId: string,
  now: number,
  feature: AiFeature,
  window: MeteredWindow,
  store?: QuotaStore,
): Promise<void> {
  if (window === 'month') return refundPool(userId, now, store)
  return refundQuota(userId, now, FEATURE_TABLE[feature], store)
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
    peek: async (userId, day) => {
      const row = await db
        .prepare(peekSql(table))
        .bind(userId, day)
        .first<{ count: number }>()
      return row?.count ?? 0
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

export function makeSqliteStore(
  db: LocalDb,
  table = ARRANGE_TABLE,
): QuotaStore {
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
    peek: async (userId, day) => {
      const row = db.prepare(peekSql(table)).get(userId, day) as
        | { count?: number }
        | undefined
      return typeof row?.count === 'number' ? row.count : 0
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
