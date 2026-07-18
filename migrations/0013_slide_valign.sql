-- 0013_slide_valign
-- Additive DDL only (ADD COLUMN). One statement per ';'. Full-line comments only (applier quirk,
-- RINDLE_NOTES #1). A per-slide VERTICAL-ALIGNMENT axis, orthogonal to `layout` (0010) and `pad`
-- (0012): where the body sits within its box. Lives on the same LayoutPicker button as the tiling —
-- one "slide framing" control. Horizontal alignment already exists as `text_align` (0004).

-- slide.valign: the vertical-position preset. '' = auto (today's behavior, so every existing slide is
-- unchanged: a full-layout body stays block/top-aligned, a tiled cell stays flex/centered) | 'top' |
-- 'middle' | 'bottom'. A non-empty value forces the body to flex and sets justify-content. All cells
-- on the card snap to it (a per-card property; see slideBodyVAlign in src/editor/types.ts).
ALTER TABLE slide ADD COLUMN valign TEXT NOT NULL DEFAULT '';
