-- 0008_deck_variants
-- Deck variants: generated audience-specific decks linked back to the source deck they were derived from.
-- Empty source_deck_id means "canonical / standalone deck"; variant_label is the short audience/purpose
-- label shown in UI; variant_prompt preserves the user request that produced the variant.
ALTER TABLE deck ADD COLUMN source_deck_id TEXT NOT NULL DEFAULT '';
ALTER TABLE deck ADD COLUMN variant_label TEXT NOT NULL DEFAULT '';
ALTER TABLE deck ADD COLUMN variant_prompt TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS deck_source ON deck (source_deck_id, modified DESC, id);
