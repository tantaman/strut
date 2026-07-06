-- Better-Auth anonymous plugin (guest-first identity, AUTH_PLAN Phase 5): adds the `isAnonymous`
-- flag to the user table. Regenerate/verify with:
--   npx @better-auth/cli@latest generate --config ./auth.cli.ts --output /tmp/auth.sql
-- (0001 is the base schema; this is the incremental delta so an already-applied D1 only runs the ALTER.)
alter table "user" add column "isAnonymous" integer;
