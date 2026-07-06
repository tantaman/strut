-- Durable per-user daily quota for "✨ AI Arrange" (server/quota.ts). The app pays for Workers AI
-- inference, so this is the AUTHORITATIVE per-user-per-UTC-day cost ceiling — the in-memory throttle in
-- src/routes/api.arrange.tsx is only a cheap first-line burst filter that doesn't survive isolate
-- recycling. Lives in the auth D1 (same `DB` binding as Better-Auth), NOT in Rindle. One row per
-- (user, day); the route bumps count on each allowed call and refunds on a failed inference. Old rows are
-- swept opportunistically. Apply to prod with `wrangler d1 migrations apply strut-auth`; dev's local
-- better-sqlite3 auth.db picks it up automatically (server/auth.ts migrateLocalAuth).
create table if not exists arrange_usage (
  user_id text not null,
  day text not null,
  count integer not null default 0,
  primary key (user_id, day)
);
