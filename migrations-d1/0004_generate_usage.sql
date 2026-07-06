-- Durable per-user daily quota for "✨ Generate slides" (server/quota.ts). Same shape + reasoning as
-- 0003_arrange_usage.sql, but a SEPARATE bucket: generating a whole batch of slides is heavier than a
-- single arrange call, so it gets its own (smaller) daily limit rather than sharing arrange's. Lives in
-- the auth D1 (same `DB` binding as Better-Auth), NOT in Rindle. One row per (user, day); the route bumps
-- count on each allowed call and refunds on a failed inference. Old rows are swept opportunistically.
-- Apply to prod with `wrangler d1 migrations apply strut-auth`; dev's local better-sqlite3 auth.db picks
-- it up automatically (server/auth.ts migrateLocalAuth).
create table if not exists generate_usage (
  user_id text not null,
  day text not null,
  count integer not null default 0,
  primary key (user_id, day)
);
