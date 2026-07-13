-- Durable per-user daily quota for "🎙️ From a recording" — the TRANSCRIBE step (audio → text via Whisper,
-- server/transcribe.ts). Same shape + reasoning as 0004_generate_usage.sql, but a SEPARATE bucket: speech-
-- to-text is a heavy Workers AI GPU call (the app pays), and it's a precursor step to narrate rather than a
-- "message" itself, so it gets its own (small) daily limit rather than sharing narrate's or the pooled
-- allowance. Lives in the auth D1 (same `DB` binding as Better-Auth), NOT in Rindle. One row per (user,
-- day); the route bumps count on each allowed call and refunds on a failed inference. Old rows are swept
-- opportunistically. Apply to prod with `wrangler d1 migrations apply strut-auth`; dev's local
-- better-sqlite3 auth.db picks it up automatically (server/auth.ts migrateLocalAuth).
create table if not exists transcribe_usage (
  user_id text not null,
  day text not null,
  count integer not null default 0,
  primary key (user_id, day)
);
