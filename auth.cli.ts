// Used ONLY by the Better-Auth CLI to emit the auth DB schema — NOT imported at runtime.
//
//   npx @better-auth/cli@latest generate --config ./auth.cli.ts --output ./migrations-d1/0001_better_auth.sql
//
// Why a separate config: the runtime config (server/auth.ts) references the D1 binding via
// `cloudflare:workers`, which doesn't exist under Node, so the CLI can't import it. D1 IS SQLite, so the
// generated DDL is identical when we point the generator at a throwaway in-memory SQLite DB. The emitted
// SQL is then applied to D1 with `wrangler d1 execute` (see docs/AUTH_SETUP.md).
//
// Requires the better-sqlite3 native build: run `pnpm approve-builds` once and allow better-sqlite3.

import Database from 'better-sqlite3'
import { betterAuth } from 'better-auth'

// Provider set + emailAndPassword must MATCH server/auth.ts, since they determine which tables/columns
// Better-Auth emits (e.g. the `account` table for social providers).
export const auth = betterAuth({
  database: new Database(':memory:'),
  emailAndPassword: { enabled: false },
  socialProviders: {
    github: { clientId: 'x', clientSecret: 'x' },
    google: { clientId: 'x', clientSecret: 'x' },
  },
})
