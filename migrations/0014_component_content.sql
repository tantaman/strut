-- 0014_component_content
-- Additive DDL only (ADD COLUMN). One statement per ';'. Full-line comments only (applier quirk,
-- RINDLE_NOTES #1). On-slide text now uses the same component model as every positioned object.

-- component.content: TipTap/ProseMirror JSON for text components; empty for every other type.
ALTER TABLE component ADD COLUMN content TEXT NOT NULL DEFAULT '';

-- slide.body_component_id: the deterministic full-slide text component edited by the doc-first surface.
ALTER TABLE slide ADD COLUMN body_component_id TEXT NOT NULL DEFAULT '';
