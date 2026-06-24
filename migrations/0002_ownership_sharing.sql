-- 0002_ownership_sharing
-- Additive DDL only (ADD COLUMN / CREATE TABLE / CREATE INDEX). One statement per ';'.
-- Full-line comments only — the applier mishandles inline trailing `-- comments` (RINDLE_NOTES #1).
-- Per-user ownership + sharing. See docs/STRUT_SPEC.md and RINDLE_NOTES (multi-tenant scoping).

-- owner_id: the principal that created the deck. Stamped authoritatively server-side from the
-- request user (never trusted from client args), so it can't be spoofed.
ALTER TABLE deck ADD COLUMN owner_id TEXT;

-- visibility: '' / 'private' = owner+collaborators only; 'public-read' = the share_token link grants
-- read-only access to anyone.
ALTER TABLE deck ADD COLUMN visibility TEXT;

-- share_token: random secret embedded in the public read-only link.
ALTER TABLE deck ADD COLUMN share_token TEXT;

CREATE INDEX IF NOT EXISTS deck_owner ON deck (owner_id, modified DESC);

-- deck_share: named collaborators granted access to a deck. role = 'editor' | 'viewer'.
CREATE TABLE IF NOT EXISTS deck_share (
  id       TEXT,
  deck_id  TEXT,
  user_id  TEXT,
  role     TEXT,
  created  REAL,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS deck_share_deck ON deck_share (deck_id);
CREATE INDEX IF NOT EXISTS deck_share_user ON deck_share (user_id);
