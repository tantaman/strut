-- 0010_slide_layout
-- Additive DDL only (ADD COLUMN). One statement per ';'. Full-line comments only (applier quirk,
-- RINDLE_NOTES #1). Generalizes body_region (a single pinned rect for the ONE markdown body) into a
-- LAYOUT: a tiling of the 1280x720 canvas into ordered cells, each destined to become its own editor.
-- Phase 1 stores only the tiling id; cell 0 hosts the existing body, so nothing about a full-layout
-- slide changes. Per-cell docs land in a later migration.

-- slide.layout: the tiling preset id. '' = full (one cell = the whole canvas) — today's behavior, so
-- every existing slide keeps rendering exactly as before. Other values ('cols-2' | 'rows-2' | 'tri' |
-- 'grid-4' | 'split-l') divide the canvas into N ordered cells; see SLIDE_LAYOUTS / layoutCells.
-- ADD COLUMN NOT NULL DEFAULT '' — SQLite requires a default; '' is the "full / inherit" sentinel.
ALTER TABLE slide ADD COLUMN layout TEXT NOT NULL DEFAULT '';
