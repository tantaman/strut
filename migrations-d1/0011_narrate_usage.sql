-- Durable per-user daily quota for "🎙️ From a recording" — the NARRATE step (transcript → slides + notes,
-- server/narrate.ts). Same shape + reasoning as 0004_generate_usage.sql: authoring a whole deck from a
-- transcript is a big model call, so it gets its own daily bucket (and, on a paid pooled plan, counts as
-- one pooled "AI message" — see POOLED_FEATURES in server/entitlements.ts). Lives in the auth D1 (same `DB`
-- binding as Better-Auth), NOT in Rindle. One row per (user, day); the route bumps count on each allowed
-- call and refunds on a failed inference. Old rows are swept opportunistically. Apply to prod with
-- `wrangler d1 migrations apply strut-auth`; dev's local better-sqlite3 auth.db picks it up automatically
-- (server/auth.ts migrateLocalAuth).
create table if not exists narrate_usage (
  user_id text not null,
  day text not null,
  count integer not null default 0,
  primary key (user_id, day)
);
