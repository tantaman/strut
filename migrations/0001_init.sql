-- 0001_init
-- Additive DDL only (CREATE TABLE / ADD COLUMN / CREATE INDEX). One statement per ';'.
-- Strut data model. See docs/STRUT_SPEC.md section 3 and 13.1.
-- Rindle column types: TEXT | INTEGER | REAL | JSON. Single-column PRIMARY KEY per table.
-- Conventions: ids are TEXT (uuid); time is REAL (epoch ms); rotations are REAL radians;
-- sort is a fractional index (TEXT).
--
-- Every column is NOT NULL: Strut never stores NULL (an "inherit the default" cell is the '' sentinel
-- string, not NULL), and declaring it makes `rindle schema gen` emit non-nullable types — `string`,
-- not `string | null` (rindle 0.4 nullability, design 206). A genuinely optional column would omit
-- NOT NULL to generate `.nullable()`; don't relax these without meaning it.

-- deck = one presentation.
-- background/surface: css-class | img:<url> | bg-custom-<hex>; bg-default = inherit.
-- chosen_presenter: impress | impressm | reveal | bespoke | handouts.
CREATE TABLE IF NOT EXISTS deck (
  id                TEXT NOT NULL,
  title             TEXT NOT NULL,
  created           REAL NOT NULL,
  modified          REAL NOT NULL,
  background        TEXT NOT NULL,
  surface           TEXT NOT NULL,
  chosen_presenter  TEXT NOT NULL,
  canned_transition TEXT NOT NULL,
  custom_stylesheet TEXT NOT NULL,
  deck_version      TEXT NOT NULL,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS deck_modified ON deck (modified DESC, id);

-- slide = one step / spatial object in the impress world.
-- x,y = overview card center; z = depth; rotate_* = radians; imp_scale default 3.
-- background/surface: per-slide override ('' = inherit; bg-transparent = show surface).
CREATE TABLE IF NOT EXISTS slide (
  id          TEXT NOT NULL,
  deck_id     TEXT NOT NULL,
  sort        TEXT NOT NULL,
  x           REAL NOT NULL,
  y           REAL NOT NULL,
  z           REAL NOT NULL,
  rotate_x    REAL NOT NULL,
  rotate_y    REAL NOT NULL,
  rotate_z    REAL NOT NULL,
  imp_scale   REAL NOT NULL,
  background  TEXT NOT NULL,
  surface     TEXT NOT NULL,
  created     REAL NOT NULL,
  modified    REAL NOT NULL,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS slide_deck ON slide (deck_id, sort);

-- Component: one polymorphic table for every on-slide object, discriminated by `type`.
-- Shared/order-sensitive fields are columns (so z-order is a plain ORDER BY and the spatial base
-- merges per-column under concurrent drags); type-specific leaves live in the `props` JSON column.
--   type: text | image | shape | video | webframe
--   spatial base: x, y, scale_x, scale_y, scale_w, scale_h, rotate, skew_x, skew_y (scale_w/scale_h
--     are the media box in px, 0 = unset); custom_classes = space-separated css classes.
--   fill: shape fill (hex without '#') — a column, not in props, because it's the one type-specific
--     field edited on its own (setShapeFill) and the optimistic client needs a per-column patch.
--   props: a typed JSON column (json<ComponentProps>(), refined in shared/app-def.ts via refineTable),
--     discriminated on `type` (see shared/componentProps.ts):
--       text     {text, size, color, font_family, text_type}   image {src, image_type}
--       shape    {shape, markup}                                video {src, video_type, src_type, short_src}
--       webframe {src}
CREATE TABLE IF NOT EXISTS component (
  id             TEXT NOT NULL,
  slide_id       TEXT NOT NULL,
  type           TEXT NOT NULL,
  z_order        INTEGER NOT NULL,
  x              REAL NOT NULL,
  y              REAL NOT NULL,
  scale_x        REAL NOT NULL,
  scale_y        REAL NOT NULL,
  scale_w        REAL NOT NULL,
  scale_h        REAL NOT NULL,
  rotate         REAL NOT NULL,
  skew_x         REAL NOT NULL,
  skew_y         REAL NOT NULL,
  custom_classes TEXT NOT NULL,
  fill           TEXT NOT NULL,
  props          JSON NOT NULL DEFAULT '{}',
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS component_slide ON component (slide_id, z_order);

-- Custom color classes minted by the user (per deck). klass e.g. bg-custom-ff0000.
CREATE TABLE IF NOT EXISTS custom_background (
  id       TEXT NOT NULL,
  deck_id  TEXT NOT NULL,
  klass    TEXT NOT NULL,
  style    TEXT NOT NULL,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS custom_background_deck ON custom_background (deck_id);
