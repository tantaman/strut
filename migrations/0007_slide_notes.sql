-- 0007_slide_notes
-- Additive DDL only (CREATE TABLE / CREATE INDEX). One statement per ';'. Full-line comments only
-- (applier quirk, RINDLE_NOTES #1).
--
-- Per-slide RESEARCH NOTES: a free-form TipTap/ProseMirror document (JSON-stringified) where an author
-- composes backing evidence / notes for a slide. Deliberately a SEPARATE 1:1 side table (keyed by
-- slide_id), NOT a column on `slide`: the deck-detail query (SlideFragment) syncs every slide column,
-- so a notes column would stream all research prose to every client on every deck open — even in
-- Play/Overview where it's never read. This table is loaded on demand by its own deck-scoped query
-- (deckNotes), only while the Research surface is open. deck_id is denormalized (mirrors
-- custom_background) so the notes query + its access gate scope by deck directly. PRIMARY KEY
-- (slide_id) makes each write an upsert (mirrors user_profile / setDisplayName), so the first note on
-- a slide and every later edit are the same op — no separate insert. Every column NOT NULL (Strut
-- never stores NULL; '' is the empty-doc sentinel). Cascade-deleted with its slide/deck in
-- server/rindle-api.ts.
CREATE TABLE IF NOT EXISTS slide_notes (
  slide_id  TEXT NOT NULL,
  deck_id   TEXT NOT NULL,
  doc       TEXT NOT NULL,
  modified  REAL NOT NULL,
  PRIMARY KEY (slide_id)
);
CREATE INDEX IF NOT EXISTS slide_notes_deck ON slide_notes (deck_id);
