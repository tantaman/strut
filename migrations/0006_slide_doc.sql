-- 0006_slide_doc
-- Additive DDL only (ADD COLUMN). One statement per ';'. Full-line comments only (applier quirk,
-- RINDLE_NOTES #1). Markdown mode now stores a TipTap/ProseMirror document as JSON (WYSIWYG editing
-- directly on the slide) instead of a raw markdown string. `doc` is the source of truth whenever
-- render_mode = 'markdown'; the older `markdown` column (0005) is left in place but no longer read
-- (it was never populated — the feature had no users when this landed).

-- slide.doc: the TipTap/ProseMirror document, JSON-stringified, rendered when render_mode = 'markdown'
-- ('' / NULL = an empty document).
ALTER TABLE slide ADD COLUMN doc TEXT;
