-- Per-user "bring your own LLM" credential store (server/modelCred.ts, OPENROUTER_PLAN.md Phase 1). Holds
-- ONE connected model per user: the provider, the chosen model id, and the user's API key sealed with
-- AES-GCM under the MODEL_CRED_KEY secret (envelope encryption — stored ciphertext only, never plaintext,
-- never returned to the browser). Lives in the auth D1 (same `DB` binding as Better-Auth + the *_usage
-- quota tables), NOT in Rindle, which replicates every row to every client — a key must never sync. FK to
-- the Better-Auth user so a deleted account drops its credential. One row per user (user_id is the PK), so
-- connecting again overwrites the prior model. Apply to prod with `wrangler d1 migrations apply strut-auth`;
-- dev's local better-sqlite3 auth.db picks it up automatically (server/auth.ts migrateLocalAuth).
create table if not exists model_credential (
  user_id    text not null primary key references "user" ("id") on delete cascade,
  provider   text not null,          -- 'openrouter' in v1
  model      text,                   -- e.g. 'anthropic/claude-3.5-sonnet'; null = the provider's default
  ciphertext text not null,          -- AES-GCM sealed API key as "base64(iv):base64(ciphertext)"
  created    text not null           -- ISO-8601 timestamp of the (re)connection
);
