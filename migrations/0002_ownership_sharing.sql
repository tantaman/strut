-- 0002_ownership_sharing
-- Additive DDL only (ADD COLUMN / CREATE TABLE / CREATE INDEX). One statement per ';'.
-- Full-line comments only — the applier mishandles inline trailing `-- comments` (RINDLE_NOTES #1).
-- Per-user ownership + sharing. See docs/STRUT_SPEC.md and RINDLE_NOTES (multi-tenant scoping).
--
-- ADD COLUMN carries NOT NULL DEFAULT: SQLite requires a default when adding a NOT NULL column, and
-- the default is the same "unset" sentinel the mutators stamp. NOT NULL keeps the generated types
-- non-nullable (design 206).

-- owner_id: the principal that created the deck. Stamped authoritatively server-side from the
-- request user (never trusted from client args), so it can't be spoofed. ('' default = a floor only;
-- createDeck always writes ctx.user, so no real row is ever ownerless.)
ALTER TABLE deck ADD COLUMN owner_id TEXT NOT NULL DEFAULT '';

-- visibility: 'private' = owner+collaborators only; 'public-read' = the share_token link grants
-- read-only access to anyone.
ALTER TABLE deck ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private';

-- share_token: random secret embedded in the public read-only link ('' = link disabled).
ALTER TABLE deck ADD COLUMN share_token TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS deck_owner ON deck (owner_id, modified DESC);

-- deck_share: named collaborators granted access to a deck. role = 'editor' | 'viewer'.
CREATE TABLE IF NOT EXISTS deck_share (
  id       TEXT NOT NULL,
  deck_id  TEXT NOT NULL,
  user_id  TEXT NOT NULL,
  role     TEXT NOT NULL,
  created  REAL NOT NULL,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS deck_share_deck ON deck_share (deck_id);
CREATE INDEX IF NOT EXISTS deck_share_user ON deck_share (user_id);
