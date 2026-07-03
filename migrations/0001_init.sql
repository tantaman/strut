-- 0001_init
-- Additive DDL only (CREATE TABLE / ADD COLUMN / CREATE INDEX). One statement per ';'.
-- Strut data model. See docs/STRUT_SPEC.md section 3 and 13.1.
-- Rindle column types: TEXT | INTEGER | REAL. Single-column PRIMARY KEY per table.
-- Conventions: ids are TEXT (uuid); time is REAL (epoch ms); rotations are REAL radians;
-- sort is a fractional index (TEXT).

-- deck = one presentation.
-- background/surface: css-class | img:<url> | bg-custom-<hex>; bg-default = inherit.
-- chosen_presenter: impress | impressm | reveal | bespoke | handouts.
CREATE TABLE IF NOT EXISTS deck (
  id                TEXT,
  title             TEXT,
  created           REAL,
  modified          REAL,
  background        TEXT,
  surface           TEXT,
  chosen_presenter  TEXT,
  canned_transition TEXT,
  custom_stylesheet TEXT,
  deck_version      TEXT,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS deck_modified ON deck (modified DESC, id);

-- slide = one step / spatial object in the impress world.
-- x,y = overview card center; z = depth; rotate_* = radians; imp_scale default 3.
-- background/surface: per-slide override ('' = inherit; bg-transparent = show surface).
CREATE TABLE IF NOT EXISTS slide (
  id          TEXT,
  deck_id     TEXT,
  sort        TEXT,
  x           REAL,
  y           REAL,
  z           REAL,
  rotate_x    REAL,
  rotate_y    REAL,
  rotate_z    REAL,
  imp_scale   REAL,
  background  TEXT,
  surface     TEXT,
  created     REAL,
  modified    REAL,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS slide_deck ON slide (deck_id, sort);

-- Component: one polymorphic table for every on-slide object, discriminated by `type`.
-- Shared/order-sensitive fields are columns (so z-order is a plain ORDER BY and the spatial base
-- merges per-column under concurrent drags); type-specific leaves live in the `props` JSON blob.
--   type: text | image | shape | video | webframe
--   spatial base: x, y, scale_x, scale_y, scale_w, scale_h, rotate, skew_x, skew_y (scale_w/scale_h
--     are the media box in px, 0 = unset); custom_classes = space-separated css classes.
--   fill: shape fill (hex without '#') — a column, not in props, because it's the one type-specific
--     field edited on its own (setShapeFill) and the optimistic client needs a per-column patch.
--   props: JSON, discriminated on `type` (see shared/componentProps.ts):
--     text     {text, size, color, font_family}   image {src, image_type}
--     shape    {shape, markup}                     video {src, video_type, src_type, short_src}
--     webframe {src}
-- (props is TEXT holding JSON today; becomes json<ComponentProps>() once Rindle types JSON columns.)
CREATE TABLE IF NOT EXISTS component (
  id             TEXT,
  slide_id       TEXT,
  type           TEXT,
  z_order        INTEGER,
  x              REAL,
  y              REAL,
  scale_x        REAL,
  scale_y        REAL,
  scale_w        REAL,
  scale_h        REAL,
  rotate         REAL,
  skew_x         REAL,
  skew_y         REAL,
  custom_classes TEXT,
  fill           TEXT,
  props          TEXT,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS component_slide ON component (slide_id, z_order);

-- Custom color classes minted by the user (per deck). klass e.g. bg-custom-ff0000.
CREATE TABLE IF NOT EXISTS custom_background (
  id       TEXT,
  deck_id  TEXT,
  klass    TEXT,
  style    TEXT,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS custom_background_deck ON custom_background (deck_id);
