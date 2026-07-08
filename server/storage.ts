// Durable per-user cumulative STORAGE counter (bytes) in the auth D1 — the ceiling for the free tier's
// unlimited PUBLIC decks (Entitlements.storageLimitBytes). Enforced on the R2 write paths: image uploads
// (server/upload.ts) and AI-generated images (src/routes/api.image.tsx). Mirrors server/quota.ts's dual
// D1/better-sqlite3 store; ONE row per user, monotonic — R2 objects are content-addressed / immutable and
// aren't GC'd on deck delete, so usage only grows. NOT touched for self-host / Pro (storageLimitBytes null
// → the callers skip it entirely). Artifacts (small, deduped, count-capped) are excluded from accounting.

const TABLE = 'storage_usage'

// user_id is the PK; `add` is an upsert-increment; `get` reads the running total (0 when absent).
const addSql =
  `INSERT INTO ${TABLE} (user_id, bytes) VALUES (?, ?) ` +
  'ON CONFLICT(user_id) DO UPDATE SET bytes = bytes + excluded.bytes'
const getSql = `SELECT bytes FROM ${TABLE} WHERE user_id = ?`

interface StorageStore {
  add: (userId: string, bytes: number) => Promise<void>
  get: (userId: string) => Promise<number>
}

// Structural subsets (avoid pulling @cloudflare/workers-types / the native module into the build graph —
// same reasoning as server/quota.ts).
interface D1Like {
  prepare: (sql: string) => {
    bind: (...args: unknown[]) => {
      first: <T>() => Promise<T | null>
      run: () => Promise<unknown>
    }
  }
}
interface LocalDb {
  prepare: (sql: string) => {
    get: (...params: unknown[]) => Record<string, unknown> | undefined
    run: (...params: unknown[]) => unknown
  }
}

function makeD1Store(db: D1Like): StorageStore {
  return {
    add: async (userId, bytes) => {
      await db.prepare(addSql).bind(userId, bytes).run()
    },
    get: async (userId) => {
      const row = await db
        .prepare(getSql)
        .bind(userId)
        .first<{ bytes: number }>()
      return row?.bytes ?? 0
    },
  }
}

function makeSqliteStore(db: LocalDb): StorageStore {
  return {
    add: async (userId, bytes) => {
      db.prepare(addSql).run(userId, bytes)
    },
    get: async (userId) => {
      const row = db.prepare(getSql).get(userId) as
        | { bytes?: number }
        | undefined
      return typeof row?.bytes === 'number' ? row.bytes : 0
    },
  }
}

let cachedStore: StorageStore | undefined
async function getStore(): Promise<StorageStore> {
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

// Open the SAME local auth.db as server/auth.ts (dev only). The table is created there by auth's
// migrateLocalAuth running migrations-d1/*.sql. String-indirected + @vite-ignore keeps better-sqlite3 out
// of the workerd/client build graph — this branch only runs under Node.
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

// ---- public API ----

/** Would storing `addBytes` more keep the user within `limit`? Returns the check plus the current total.
 *  A coarse pre-check — concurrent writes can race slightly past the cap, bounded by the per-file max. */
export async function checkStorage(
  userId: string,
  addBytes: number,
  limit: number,
  store?: StorageStore,
): Promise<{ allowed: boolean; used: number }> {
  const used = await (store ?? (await getStore())).get(userId)
  return { allowed: used + addBytes <= limit, used }
}

/** Record `bytes` of newly-stored data against the user's running total (call AFTER a successful write). */
export async function recordStorage(
  userId: string,
  bytes: number,
  store?: StorageStore,
): Promise<void> {
  await (store ?? (await getStore())).add(userId, bytes)
}

/** The user's current stored bytes. */
export async function getStorageUsed(
  userId: string,
  store?: StorageStore,
): Promise<number> {
  return (store ?? (await getStore())).get(userId)
}
