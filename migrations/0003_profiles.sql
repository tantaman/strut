-- 0003_profiles
-- Additive DDL only. One statement per ';'. Full-line comments only (applier quirk, RINDLE_NOTES #1).
-- Lightweight per-user profile so collaborators can be shown by a friendly display name instead of
-- their opaque Strut id. id = the user principal (the same value carried in x-user / owner_id).
-- World-readable (display names aren't secret); writable only to its own owner (enforced server-side).
CREATE TABLE IF NOT EXISTS user_profile (
  id           TEXT NOT NULL,
  display_name TEXT NOT NULL,
  updated      REAL NOT NULL,
  PRIMARY KEY (id)
);
