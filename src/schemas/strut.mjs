export default {
  namespace: "default",
  name: "strut",
  active: true,
  content: /*sql*/ `
CREATE TABLE IF NOT EXISTS "deck" (
  "id" INTEGER primary key,
  "title",
  "created",
  "modified",
  "theme_id",
  "chosen_presenter"
);

CREATE TABLE IF NOT EXISTS "slide" (
  "id" INTEGER primary key,
  "deck_id",
  "order",
  "created",
  "modified",
  "x",
  "y",
  "z"
);

CREATE INDEX IF NOT EXISTS "slide_deck_id" ON "slide" ("deck_id", "order");

CREATE TABLE IF NOT EXISTS "text_component" (
  "id" INTEGER primary key,
  "slide_id",
  "text",
  "styles",
  "x",
  "y",
  "width",
  "height"
);

CREATE TABLE IF NOT EXISTS "embed_component" ("id" primary key, "slide_id", "src", "x", "y");

CREATE INDEX IF NOT EXISTS "embed_component_slide_id" ON "embed_component" ("slide_id");

CREATE TABLE IF NOT EXISTS "shape_component" (
  "id" INTEGER primary key,
  "slide_id",
  "type",
  "props",
  "x",
  "y"
);

CREATE INDEX IF NOT EXISTS "shape_component_slide_id" ON "shape_component" ("slide_id");

CREATE TABLE IF NOT EXISTS "line_component" ("id" primary key, "slide_id", "props");

CREATE INDEX IF NOT EXISTS "line_component_slide_id" ON "line_component" ("slide_id");

CREATE TABLE IF NOT EXISTS "line_point" ("id" primary key, "line_id", "x", "y");

CREATE INDEX IF NOT EXISTS "line_point_line_id" ON "line_point" ("line_id");

CREATE INDEX IF NOT EXISTS "text_component_slide_id" ON "text_component" ("slide_id");

CREATE TABLE IF NOT EXISTS "theme" (
  "id" INTEGER primary key,
  "name",
  "bg_colorset",
  "fg_colorset",
  "fontset",
  "surface_color",
  "font_color"
);

CREATE TABLE IF NOT EXISTS "recent_color" (
  "color" INTEGER primary key,
  "last_used",
  "first_used",
  "theme_id"
);

CREATE TABLE IF NOT EXISTS "presenter" (
  "name" primary key,
  "available_transitions",
  "picked_transition"
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
  "deck_id",
  "slide_id",
  primary key ("deck_id", "slide_id")
);

CREATE TABLE IF NOT EXISTS "selected_component" (
  "slide_id",
  "component_id",
  "component_type",
  primary key ("slide_id", "component_id")
);

CREATE TABLE IF NOT EXISTS "undo_stack" (
  "deck_id",
  "operation",
  "order",
  primary key ("deck_id", "order")
);

CREATE TABLE IF NOT EXISTS "redo_stack" (
  "deck_id",
  "operation",
  "order",
  primary key ("deck_id", "order")
);
`,
};
