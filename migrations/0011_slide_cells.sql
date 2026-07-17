-- 0011_slide_cells
-- Additive DDL only (ADD COLUMN). One statement per ';'. Full-line comments only (applier quirk,
-- RINDLE_NOTES #1). Phase 2 of the layout tiling (see 0010): each cell becomes its OWN editor, so a
-- cols-2 slide can carry text on the left AND the right. Cell 0 keeps living in `slide.doc` (unchanged),
-- so every existing slide is byte-identical; cells 1..N live here.

-- slide.cells: the per-cell content for cells 1..N, as a JSON string[] of TipTap doc JSON strings,
-- index-aligned to layoutCells(layout). Index 0 is a placeholder ('') — cell 0's doc is always the
-- `doc` column. '' (no cells) = a slide whose only body is cell 0, i.e. today's behavior. See
-- parseCells / cellDocAt / writeCellDoc in src/editor/types.ts.
ALTER TABLE slide ADD COLUMN cells TEXT NOT NULL DEFAULT '';
