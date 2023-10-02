
CREATE TABLE IF NOT EXISTS deck (
  id 'IID_of<Deck>' PRIMARY KEY NOT NULL,
  title TEXT DEFAULT 'Untitled',
  created INT,
  modified INT,
  theme_id 'IID_of<Theme>',
  chosen_presenter TEXT DEFAULT 'impress'
);

CREATE TABLE IF NOT EXISTS "slide" (
  id 'IID_of<Slide>' PRIMARY KEY NOT NULL,
  deck_id 'IID_of<Deck>',
  "order" TEXT,
  created INT,
  modified INT,
  x FLOAT,
  y FLOAT,
  z FLOAT
);

-- find slides by deck. Order them within the given deck
CREATE INDEX IF NOT EXISTS "slide_deck_id_order" ON "slide" ("deck_id", "order");

CREATE TABLE IF NOT EXISTS "text_component" (
  "id" 'IID_of<TextComponent>' primary key not null,
  "slide_id" 'IID_of<Slide>',
  "text" TEXT,
  "styles" TEXT,
  "x" FLOAT,
  "y" FLOAT
);

CREATE TABLE IF NOT EXISTS "embed_component" ("id" 'IID_of<EmbedComponent>' primary key not null, "slide_id" 'IID_of<Slide>', "src", "x", "y");

CREATE INDEX IF NOT EXISTS "embed_component_slide_id" ON "embed_component" ("slide_id");

CREATE TABLE IF NOT EXISTS "shape_component" (
  "id" 'IID_of<ShapeComponent>' primary key NOT NULL,
  "slide_id" 'IID_of<Slide>',
  "type" '"rectangle" | "ellipse" | "triangle" | "ngon" | "line"',
  "props" TEXT,
  "x" FLOAT,
  "y" FLOAT
);

CREATE INDEX IF NOT EXISTS "shape_component_slide_id" ON "shape_component" ("slide_id");

CREATE TABLE IF NOT EXISTS "line_component" ("id" 'IID_of<LineComponent>' primary key not null, "slide_id" 'IID_of<Slide>', "props");

CREATE INDEX IF NOT EXISTS "line_component_slide_id" ON "line_component" ("slide_id");

CREATE TABLE IF NOT EXISTS "line_point" ("id" 'IID_of<LinePoint>' primary key not null, "line_id" 'IID_of<LineComponent>', "x", "y");

CREATE INDEX IF NOT EXISTS "line_point_line_id" ON "line_point" ("line_id");

CREATE INDEX IF NOT EXISTS "text_component_slide_id" ON "text_component" ("slide_id");

CREATE TABLE IF NOT EXISTS theme (
  id 'IID_of<Theme>' PRIMARY KEY NOT NULL,
  name TEXT,
  bg_colorset TEXT,
  fg_colorset TEXT,
  fontset TEXT,
  surface_color TEXT,
  slide_color TEXT,
  font_color TEXT
);

CREATE TABLE IF NOT EXISTS "recent_color" (
  "color" INTEGER primary key not null,
  "last_used" INT,
  "first_used" INT,
  "theme_id" 'IID_of<Theme>'
);

CREATE TABLE IF NOT EXISTS "presenter" (
  "name" text primary key not null,
  "available_transitions" 'JsonSerialized<string[]>',
  "picked_transition" text
);

SELECT crsql_as_crr('deck');

SELECT crsql_as_crr('slide');

SELECT crsql_fract_as_ordered('slide', 'order', 'deck_id');

SELECT crsql_as_crr('text_component');

SELECT crsql_as_crr('embed_component');

SELECT crsql_as_crr('shape_component');

SELECT crsql_as_crr('line_component');

SELECT crsql_as_crr('line_point');

SELECT crsql_as_crr('theme');

SELECT crsql_as_crr('recent_color');

SELECT crsql_as_crr('presenter');

CREATE TABLE IF NOT EXISTS "selected_slide" (
  "deck_id" 'IID_of<Deck>' not null,
  "slide_id" 'IID_of<Slide>' not null,
  primary key ("deck_id", "slide_id")
);

CREATE TABLE IF NOT EXISTS "selected_component" (
  "slide_id" 'IID_of<Slide>' NOT NULL,
  "component_id" 'AnyComponentID' NOT NULL,
  "component_type" 'ComponentType',
  primary key ("slide_id", "component_id")
);

CREATE TABLE IF NOT EXISTS "undo_stack" (
  "deck_id" 'IID_of<Deck>' NOT NULL,
  "operation",
  "order" INT NOT NULL,
  primary key ("deck_id", "order")
);

CREATE TABLE IF NOT EXISTS "redo_stack" (
  "deck_id" 'IID_of<Deck>' NOT NULL,
  "operation",
  "order" INT NOT NULL,
  primary key ("deck_id", "order")
);
