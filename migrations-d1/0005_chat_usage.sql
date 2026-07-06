-- Durable per-user daily quota for "✨ Chat" (server/quota.ts). Same shape + reasoning as
-- 0003_arrange_usage.sql / 0004_generate_usage.sql, but a SEPARATE bucket: chat is metered ONE unit per
-- user turn (each `send` = one inference). Turns are individually cheap but a conversation is many of them,
-- so it gets its own (larger) daily limit rather than sharing arrange's/generate's. Lives in the auth D1
-- (same `DB` binding as Better-Auth), NOT in Rindle. One row per (user, day); the route bumps count on each
-- allowed turn and refunds only when the model call fails BEFORE any tokens stream (a mid-stream failure
-- keeps the unit — partial inference was spent). Old rows are swept opportunistically.
-- Apply to prod with `wrangler d1 migrations apply strut-auth`; dev's local better-sqlite3 auth.db picks it
-- up automatically (server/auth.ts migrateLocalAuth).
create table if not exists chat_usage (
  user_id text not null,
  day text not null,
  count integer not null default 0,
  primary key (user_id, day)
);
