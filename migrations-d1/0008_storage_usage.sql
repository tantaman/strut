-- Durable per-user cumulative STORAGE counter (bytes), backing the free-tier storage ceiling
-- (Entitlements.storageLimitBytes; server/storage.ts). Lives in the auth D1 (same `DB` binding as
-- Better-Auth), NOT in Rindle. One row per user, incremented on each stored image / AI image; monotonic —
-- R2 objects are content-addressed / immutable and aren't garbage-collected on deck delete, so usage only
-- grows. Untouched for self-host / Pro (storageLimitBytes null → the write paths skip it). Apply to prod
-- with `wrangler d1 migrations apply strut-auth`; dev's local better-sqlite3 auth.db picks it up
-- automatically (server/auth.ts migrateLocalAuth).
create table if not exists storage_usage (
  user_id text primary key,
  bytes integer not null default 0
);
