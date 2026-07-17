-- 0009_slide_body_region
-- Additive DDL only (ADD COLUMN). One statement per ';'. Full-line comments only (applier quirk,
-- RINDLE_NOTES #1). Partitions the markdown body: it can occupy a half of the slide canvas instead of
-- the full 1280x720, so text sits beside a half-bleed background image (the pairing the existing
-- background-image `layout` enum already renders on the other half).

-- slide.body_region: which part of the canvas the markdown body occupies.
-- '' = AUTO — derived from the slide's background image so it takes the half the image doesn't:
--   image layout 'left' -> body right, 'right' -> body left, 'full'/no image -> body full.
-- Any other value PINS it, overriding the derivation: 'full' | 'left' | 'right' | 'top' | 'bottom'.
-- ADD COLUMN NOT NULL DEFAULT '' — SQLite requires a default; '' is the "auto / inherit" sentinel, so
-- every existing slide keeps rendering full-bleed exactly as before.
ALTER TABLE slide ADD COLUMN body_region TEXT NOT NULL DEFAULT '';
