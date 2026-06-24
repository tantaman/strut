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

-- Component spatial base (repeated per type table; Rindle has no table inheritance):
-- slide_id, z_order, x, y, scale_x, scale_y, scale_w, scale_h, rotate, skew_x, skew_y, custom_classes.
-- scale_w/scale_h: box size in px for media; 0 = unset.

-- TextBox: rich text body + font state. size = font px, color = hex without '#'.
CREATE TABLE IF NOT EXISTS text_component (
  id             TEXT,
  slide_id       TEXT,
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
  text           TEXT,
  size           INTEGER,
  color          TEXT,
  font_family    TEXT,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS text_component_slide ON text_component (slide_id, z_order);

-- Image: URL/data-URI src; image_type = PNG | JPEG | SVG | ...
CREATE TABLE IF NOT EXISTS image_component (
  id             TEXT,
  slide_id       TEXT,
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
  src            TEXT,
  image_type     TEXT,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS image_component_slide ON image_component (slide_id, z_order);

-- Shape: builtin name + inline SVG markup + fill (hex without '#').
CREATE TABLE IF NOT EXISTS shape_component (
  id             TEXT,
  slide_id       TEXT,
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
  shape          TEXT,
  markup         TEXT,
  fill           TEXT,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS shape_component_slide ON shape_component (slide_id, z_order);

-- Video: youtube | html5. src_type = mime or 'yt'; short_src = youtube id / matched url.
CREATE TABLE IF NOT EXISTS video_component (
  id             TEXT,
  slide_id       TEXT,
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
  src            TEXT,
  video_type     TEXT,
  src_type       TEXT,
  short_src      TEXT,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS video_component_slide ON video_component (slide_id, z_order);

-- WebFrame: iframe url.
CREATE TABLE IF NOT EXISTS webframe_component (
  id             TEXT,
  slide_id       TEXT,
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
  src            TEXT,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS webframe_component_slide ON webframe_component (slide_id, z_order);

-- Custom color classes minted by the user (per deck). klass e.g. bg-custom-ff0000.
CREATE TABLE IF NOT EXISTS custom_background (
  id       TEXT,
  deck_id  TEXT,
  klass    TEXT,
  style    TEXT,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS custom_background_deck ON custom_background (deck_id);
