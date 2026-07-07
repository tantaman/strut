// Per-user "bring your own LLM" credential store (OPENROUTER_PLAN.md Phase 1). Holds ONE connected model
// per user — provider, chosen model id, and an envelope-ENCRYPTED API key — in the auth D1 (the `DB`
// binding, same store as Better-Auth + server/quota.ts, NOT Rindle: a key must never sync to browsers).
// The table is migrations-d1/0007_model_credential.sql.
//
// Runtime access mirrors server/quota.ts exactly: under workerd the `DB` binding is an OBJECT binding
// reached via the `cloudflare:workers` module (not process.env); under `pnpm dev` (Node, no D1) we open
// the same local better-sqlite3 auth.db. The native module is dynamically imported + @vite-ignore'd (via a
// string-indirected specifier) so it never enters the workerd/client build graph.
//
// The API key is NEVER stored in plaintext and NEVER returned to the browser. It is sealed with AES-GCM
// under the MODEL_CRED_KEY secret (envelope encryption) and decrypted only here, server-side, to make the
// provider call (server/llm.ts, Phase 3). getCredential() returns the plaintext key for that server use
// ONLY; hasCredential() is the browser-safe, key-free status the api.model.status route returns.

const TABLE = 'model_credential'

/** A user's connected model, including the PLAINTEXT key — server-only; never serialize `apiKey`. */
export interface ModelCredential {
  provider: string // 'openrouter' in v1
  model: string | null // e.g. 'anthropic/claude-3.5-sonnet'; null = the provider's default
  apiKey: string
}

/** The browser-safe status shape — whether a model is connected, and which, WITHOUT the key. */
export interface ModelStatus {
  connected: boolean
  provider: string | null
  model: string | null
}

/** Thrown when a credential can't be sealed/opened — MODEL_CRED_KEY missing/invalid or corrupt ciphertext.
 *  Routes map it to a clear 4xx/5xx (e.g. "connecting a model isn't configured") rather than a 500 that
 *  leaks crypto internals. */
export class ModelCredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ModelCredError'
  }
}

// ---- envelope encryption (AES-GCM under MODEL_CRED_KEY) ----

// MODEL_CRED_KEY is a base64-encoded 32-byte key on process.env (nodejs_compat surfaces wrangler secrets
// there, exactly like BETTER_AUTH_SECRET). It's imported once as a non-extractable AES-GCM CryptoKey.
// WebCrypto's `crypto.subtle` is a global under BOTH workerd and Node 20+, so no dynamic import is needed.
let cachedKey: CryptoKey | undefined
async function cryptoKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey
  const b64 = process.env.MODEL_CRED_KEY
  if (!b64) {
    throw new ModelCredError(
      'MODEL_CRED_KEY is not set — required to seal BYO model credentials (openssl rand -base64 32).',
    )
  }
  const raw = base64ToBytes(b64)
  if (raw.length !== 32) {
    throw new ModelCredError(
      'MODEL_CRED_KEY must decode to 32 bytes (generate with: openssl rand -base64 32).',
    )
  }
  cachedKey = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ])
  return cachedKey
}

const textEnc = new TextEncoder()
const textDec = new TextDecoder()

/** Seal a plaintext string → "base64(iv):base64(ciphertext)". Fresh random 12-byte IV per call. */
async function seal(plain: string): Promise<string> {
  const key = await cryptoKey()
  // ArrayBuffer-backed so the typed array is `Uint8Array<ArrayBuffer>` (a BufferSource) under TS 5.7+'s
  // generic typed-array typing — a bare `new Uint8Array(n)` widens to ArrayBufferLike and WebCrypto rejects it.
  const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, textEnc.encode(plain))
  return `${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(ct))}`
}

/** Open a "base64(iv):base64(ciphertext)" blob → plaintext. Throws ModelCredError on tamper/corruption. */
async function open(blob: string): Promise<string> {
  const key = await cryptoKey()
  const sep = blob.indexOf(':')
  if (sep <= 0) throw new ModelCredError('corrupt credential ciphertext')
  const iv = base64ToBytes(blob.slice(0, sep))
  const ct = base64ToBytes(blob.slice(sep + 1))
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
    return textDec.decode(pt)
  } catch {
    throw new ModelCredError(
      'could not decrypt credential (wrong MODEL_CRED_KEY or corrupt data)',
    )
  }
}

// atob/btoa are globals under both workerd and Node — used for the base64 <-> bytes round-trip.
function bytesToBase64(b: Uint8Array): string {
  let s = ''
  for (const byte of b) s += String.fromCharCode(byte)
  return btoa(s)
}
// Returns an ArrayBuffer-backed Uint8Array so it satisfies WebCrypto's BufferSource (see seal()).
function base64ToBytes(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s.trim())
  const out = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

// ---- store ----

// The row as stored: the key is ciphertext, never plaintext.
interface CredRow {
  provider: string
  model: string | null
  ciphertext: string
}

/** The minimal store the credential module needs: upsert one row per user, read it back, delete it.
 *  Backed by D1 (workerd) or better-sqlite3 (dev) — the same dual-store pattern as server/quota.ts. */
interface CredStore {
  put: (
    userId: string,
    provider: string,
    model: string | null,
    ciphertext: string,
    created: string,
  ) => Promise<void>
  get: (userId: string) => Promise<CredRow | null>
  del: (userId: string) => Promise<void>
}

// One row per user: connecting again REPLACES the prior model (ON CONFLICT on the PK). Table name is an
// internal constant, never user input — safe to interpolate.
const upsertSql =
  `INSERT INTO ${TABLE} (user_id, provider, model, ciphertext, created) VALUES (?, ?, ?, ?, ?) ` +
  'ON CONFLICT(user_id) DO UPDATE SET provider = excluded.provider, model = excluded.model, ' +
  'ciphertext = excluded.ciphertext, created = excluded.created'
const selectSql = `SELECT provider, model, ciphertext FROM ${TABLE} WHERE user_id = ?`
const deleteSql = `DELETE FROM ${TABLE} WHERE user_id = ?`

// Subset of the D1 prepared-statement surface we touch (structural — avoids importing
// @cloudflare/workers-types, whose globals shadow the DOM lib; same reasoning as server/quota.ts).
interface D1Like {
  prepare: (sql: string) => {
    bind: (...args: unknown[]) => {
      first: <T>() => Promise<T | null>
      run: () => Promise<unknown>
    }
  }
}

function makeD1Store(db: D1Like): CredStore {
  return {
    put: async (userId, provider, model, ciphertext, created) => {
      await db.prepare(upsertSql).bind(userId, provider, model, ciphertext, created).run()
    },
    get: async (userId) => {
      return (await db.prepare(selectSql).bind(userId).first<CredRow>()) ?? null
    },
    del: async (userId) => {
      await db.prepare(deleteSql).bind(userId).run()
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

function makeSqliteStore(db: LocalDb): CredStore {
  return {
    put: async (userId, provider, model, ciphertext, created) => {
      db.prepare(upsertSql).run(userId, provider, model, ciphertext, created)
    },
    get: async (userId) => {
      const row = db.prepare(selectSql).get(userId) as CredRow | undefined
      return row ?? null
    },
    del: async (userId) => {
      db.prepare(deleteSql).run(userId)
    },
  }
}

let cachedStore: CredStore | undefined
async function getStore(): Promise<CredStore> {
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
  const { default: Database } = (await import(/* @vite-ignore */ sqliteSpec)) as {
    default: new (path: string) => LocalDb & { pragma: (s: string) => unknown }
  }
  const file = process.env.STRUT_AUTH_DB ?? `${process.cwd()}/auth.db`
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  return db
}

// ---- public API ----

/** Store (or replace) the user's connected model. Encrypts `cred.apiKey` before it touches the DB, and
 *  overwrites any prior connection for this user. Throws ModelCredError if MODEL_CRED_KEY is missing. */
export async function putCredential(userId: string, cred: ModelCredential): Promise<void> {
  const ciphertext = await seal(cred.apiKey)
  const store = await getStore()
  await store.put(userId, cred.provider, cred.model, ciphertext, new Date().toISOString())
}

/** The DECRYPTED credential for SERVER use (the provider call), or null if the user hasn't connected one.
 *  Never serialize the returned `apiKey` to a client response. Throws ModelCredError if decryption fails
 *  (wrong/rotated MODEL_CRED_KEY or corrupt row). */
export async function getCredential(userId: string): Promise<ModelCredential | null> {
  const store = await getStore()
  const row = await store.get(userId)
  if (!row) return null
  return { provider: row.provider, model: row.model ?? null, apiKey: await open(row.ciphertext) }
}

/** Browser-safe status — whether a model is connected, and which, WITHOUT decrypting the key. Cheap: no
 *  crypto, so it never touches MODEL_CRED_KEY (safe to call even if that secret is unset). */
export async function hasCredential(userId: string): Promise<ModelStatus> {
  const store = await getStore()
  const row = await store.get(userId)
  if (!row) return { connected: false, provider: null, model: null }
  return { connected: true, provider: row.provider, model: row.model ?? null }
}

/** Forget the user's connected model. */
export async function deleteCredential(userId: string): Promise<void> {
  const store = await getStore()
  await store.del(userId)
}
