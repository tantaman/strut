-- 0015_aamu_scope
-- Aamu tenant and project scope. Empty strings preserve standalone Strut decks.

ALTER TABLE deck ADD COLUMN cid TEXT NOT NULL DEFAULT '';
ALTER TABLE deck ADD COLUMN pid TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS deck_aamu_project ON deck (cid, pid, modified DESC, id);
