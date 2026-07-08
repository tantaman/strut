-- Durable per-user daily quota for "✨ add image → generate" (server/quota.ts). Same shape + reasoning as
-- 0004_generate_usage.sql, but a SEPARATE bucket: text-to-image is a heavy Workers AI call, so it gets its
-- own daily limit rather than sharing the slide-generation allowance. Lives in the auth D1 (same `DB`
-- binding as Better-Auth), NOT in Rindle. One row per (user, day); the route bumps count on each allowed
-- call and refunds on a failed generation. Old rows are swept opportunistically.
-- Apply to prod with `wrangler d1 migrations apply strut-auth`; dev's local better-sqlite3 auth.db picks
-- it up automatically (server/auth.ts migrateLocalAuth).
create table if not exists image_usage (
  user_id text not null,
  day text not null,
  count integer not null default 0,
  primary key (user_id, day)
);
