-- 0005_markdown_theme
-- Additive DDL only (ADD COLUMN). One statement per ';'. Full-line comments only (applier quirk,
-- RINDLE_NOTES #1). Markdown slide mode + the per-slide/deck alignment axis of the unified theme.
-- A slide is EITHER spatial-component mode OR markdown mode (slide.render_mode). The deck carries a
-- default so new slides inherit it (deck.default_slide_mode). Flipping modes is non-destructive: the
-- slide's components stay in `component` rows, just not rendered while render_mode = 'markdown'.

-- slide.markdown: the markdown source rendered when render_mode = 'markdown' ('' / NULL = empty).
ALTER TABLE slide ADD COLUMN markdown TEXT;
-- slide.render_mode: '' / NULL = spatial (components) | 'markdown' = full-slide markdown surface.
ALTER TABLE slide ADD COLUMN render_mode TEXT;
-- slide.text_align: per-slide alignment override ('' / NULL = inherit the deck default).
ALTER TABLE slide ADD COLUMN text_align TEXT;
-- deck.default_slide_mode: render_mode stamped on newly added slides ('' = spatial | 'markdown').
ALTER TABLE deck ADD COLUMN default_slide_mode TEXT;
-- deck.text_align: deck-wide default alignment ('' / NULL = built-in default 'left').
ALTER TABLE deck ADD COLUMN text_align TEXT;
