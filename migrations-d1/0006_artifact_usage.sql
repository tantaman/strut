-- Durable per-user daily quota for runnable "artifact" blocks (server/quota.ts). Unlike the AI features,
-- artifacts don't spend Workers AI inference — this bounds R2 storage / upload abuse, so the cap is
-- generous. Lives in the auth D1 (same `DB` binding as Better-Auth), NOT in Rindle. One row per
-- (user, day); server/artifact.ts bumps count on each stored artifact and refunds on a store failure. Old
-- rows are swept opportunistically. Apply to prod with `wrangler d1 migrations apply strut-auth`; dev's
-- local better-sqlite3 auth.db picks it up automatically (server/auth.ts migrateLocalAuth).
create table if not exists artifact_usage (
  user_id text not null,
  day text not null,
  count integer not null default 0,
  primary key (user_id, day)
);
