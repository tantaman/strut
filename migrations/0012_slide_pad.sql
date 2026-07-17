-- 0012_slide_pad
-- Additive DDL only (ADD COLUMN). One statement per ';'. Full-line comments only (applier quirk,
-- RINDLE_NOTES #1). A per-slide DENSITY axis, orthogonal to `layout` (0010): how much safe-area padding
-- the body gets. Lives on the same LayoutPicker button as the tiling — one "slide framing" control.

-- slide.pad: the density preset. '' = comfortable (today's safe-area padding, so every existing slide is
-- unchanged) | 'compact' (~half) | 'edge' (0 = full bleed, content to the slide edges). Scales only the
-- outer safe-area (PAD_X/PAD_Y), never the interior cell gutters. See slidePadScale in src/editor/types.ts.
ALTER TABLE slide ADD COLUMN pad TEXT NOT NULL DEFAULT '';
