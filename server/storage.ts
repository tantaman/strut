// Durable per-user cumulative STORAGE counters in the auth D1 — total BYTES and total IMAGE COUNT, the
// two ceilings for the free tier's unlimited PUBLIC decks (Entitlements.storageLimitBytes /
// Entitlements.imageLimit). Enforced on image uploads (server/upload.ts). Uses the auth D1 in production
// and better-sqlite3 locally; ONE row per user, monotonic — R2 objects are content-addressed / immutable
// and aren't GC'd on deck delete, so usage only grows (removing an image from a slide does not free
// quota). NOT touched for self-host / Pro (both limits null → the callers skip it entirely). Artifacts
// (small, deduped, burst-throttled) are excluded from accounting.

const TABLE = 'storage_usage'

/** A user's running totals. `images` is 0 for rows written before 0012_storage_image_count.sql. */
export interface StorageUsage {
  bytes: number
  images: number
}

// user_id is the PK; `add` is an upsert-increment on both counters; `get` reads the running totals
// (zeroes when absent).
const addSql =
  `INSERT INTO ${TABLE} (user_id, bytes, images) VALUES (?, ?, ?) ` +
  'ON CONFLICT(user_id) DO UPDATE SET bytes = bytes + excluded.bytes, ' +
  'images = images + excluded.images'
const getSql = `SELECT bytes, images FROM ${TABLE} WHERE user_id = ?`

interface StorageStore {
  add: (userId: string, bytes: number, images: number) => Promise<void>
  get: (userId: string) => Promise<StorageUsage>
}

// Structural subsets (avoid pulling @cloudflare/workers-types / the native module into the build graph —
// keeps native runtime globals out of the build graph).
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

function num(v: unknown): number {
  return typeof v === 'number' ? v : 0
}

function makeD1Store(db: D1Like): StorageStore {
  return {
    add: async (userId, bytes, images) => {
      await db.prepare(addSql).bind(userId, bytes, images).run()
    },
    get: async (userId) => {
      const row = await db
        .prepare(getSql)
        .bind(userId)
        .first<{ bytes: number; images: number }>()
      return { bytes: num(row?.bytes), images: num(row?.images) }
    },
  }
}

function makeSqliteStore(db: LocalDb): StorageStore {
  return {
    add: async (userId, bytes, images) => {
      db.prepare(addSql).run(userId, bytes, images)
    },
    get: async (userId) => {
      const row = db.prepare(getSql).get(userId)
      return { bytes: num(row?.bytes), images: num(row?.images) }
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

/** The plan's storage ceilings; null on either axis = unlimited on that axis. */
export interface StorageLimits {
  bytes: number | null
  images: number | null
}

/** Which ceiling a rejected upload hit, so the caller can word the error. */
export type StorageDenial = 'bytes' | 'images'

/** Would storing ONE more image of `addBytes` keep the user inside both ceilings? Returns the verdict
 *  (plus which axis blocked it) and the current totals. A coarse pre-check — concurrent uploads can race
 *  slightly past a cap, bounded by the per-file max on bytes and by the in-flight count on images. */
export async function checkStorage(
  userId: string,
  addBytes: number,
  limits: StorageLimits,
  store?: StorageStore,
): Promise<{ allowed: boolean; denied?: StorageDenial; used: StorageUsage }> {
  const used = await (store ?? (await getStore())).get(userId)
  if (limits.bytes != null && used.bytes + addBytes > limits.bytes)
    return { allowed: false, denied: 'bytes', used }
  if (limits.images != null && used.images + 1 > limits.images)
    return { allowed: false, denied: 'images', used }
  return { allowed: true, used }
}

/** Record `bytes` and `images` of newly-stored data against the user's running totals (call AFTER a
 *  successful write). Both counters are monotonic — see the header. */
export async function recordStorage(
  userId: string,
  bytes: number,
  images: number,
  store?: StorageStore,
): Promise<void> {
  await (store ?? (await getStore())).add(userId, bytes, images)
}

/** The user's current stored bytes + image count. */
export async function getStorageUsed(
  userId: string,
  store?: StorageStore,
): Promise<StorageUsage> {
  return (store ?? (await getStore())).get(userId)
}
