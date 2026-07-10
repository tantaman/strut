-- Durable per-user POOLED monthly AI allowance for paid plans (server/quota.ts). Unlike the per-feature
-- daily buckets (arrange_usage, chat_usage, …), this is ONE counter shared across the inference features
-- (arrange/generate/chat/image): any of those ✨ actions bumps the same row, so a plan's monthly allowance
-- (e.g. 1000/month for Pro) is spent from a single pool. Same shape + store logic as the daily tables —
-- the `day` column just holds a `YYYY-MM` MONTH key here instead of a `YYYY-MM-DD` day key (utcMonth vs
-- utcDay). One row per (user, month); the route bumps count on each allowed call, refunds on a failed
-- inference, and old-month rows are swept opportunistically. Lives in the auth D1 (same `DB` binding as
-- Better-Auth), NOT in Rindle. Apply to prod with `wrangler d1 migrations apply strut-auth`; dev's local
-- better-sqlite3 auth.db picks it up automatically (server/auth.ts migrateLocalAuth).
create table if not exists ai_pool_usage (
  user_id text not null,
  day text not null,
  count integer not null default 0,
  primary key (user_id, day)
);
