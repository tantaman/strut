-- 0009_room_share_ids
-- A deterministic (deck, user) key lets a room authorise an editor using only a point read.
-- Existing UI already represents one collaborator row per user/deck; the unique index makes that
-- invariant explicit before rewriting IDs.

CREATE UNIQUE INDEX IF NOT EXISTS deck_share_deck_user ON deck_share (deck_id, user_id);

UPDATE deck_share
SET id = 'deck:' || deck_id || ':' || user_id;
