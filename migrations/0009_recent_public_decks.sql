-- 0009_recent_public_decks
-- Public deck discovery reads visibility='public-read' in creation order. This composite index keeps
-- that bounded feed off the general modified-time dashboard index. No new visibility state is needed:
-- public-read is the discoverable/read-only state; private remains owner/collaborator-only.
CREATE INDEX IF NOT EXISTS deck_public_created ON deck (visibility, created DESC, id);
