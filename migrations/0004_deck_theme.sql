-- 0004_deck_theme
-- Additive DDL only. One statement per ';'. Full-line comments only (applier quirk, RINDLE_NOTES #1).
-- Deck-level text theme defaults (spec: the Theme picker). Text components fall into two categories
-- (heading | body, the component's props.text_type); a text component with an EMPTY color/font_family
-- inherits the deck default for its category. Empty/NULL here = the built-in default (Lato / 111111).
-- Fonts are font-family names (see src/config.ts FONT_FAMILIES); colors are bare hex (no '#').
ALTER TABLE deck ADD COLUMN heading_font TEXT;
ALTER TABLE deck ADD COLUMN heading_color TEXT;
ALTER TABLE deck ADD COLUMN body_font TEXT;
ALTER TABLE deck ADD COLUMN body_color TEXT;
