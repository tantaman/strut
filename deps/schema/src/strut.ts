import { schema } from "@vlcn.io/typed-sql";

export type ShapeType =
  | "ellipse"
  | "rectangle"
  | "triangle"
  | "hexagon"
  | "octagon";
export type ComponentType = "text" | "embed" | "shape" | "line";

export const StrutSchema = schema<
  Readonly<{
    deck: Readonly<{
      id: number;
      title: string | null;
      created: number;
      modified: number;
      theme_id: number | null;
      chosen_presenter: string | null;
    }>;
    slide: Readonly<{
      id: number;
      deck_id: number | null;
      order: string | null;
      created: number;
      modified: number;
      x: any | null;
      y: any | null;
      z: any | null;
    }>;
    text_component: Readonly<{
      id: number;
      slide_id: number | null;
      text: string | null;
      styles: string | null;
      x: number | null;
      y: number | null;
      width: number | null;
      height: number | null;
    }>;
    embed_component: Readonly<{
      id: number;
      slide_id: number | null;
      src: string | null;
      x: number | null;
      y: number | null;
    }>;
    shape_component: Readonly<{
      id: number;
      slide_id: number | null;
      type: ShapeType | null;
      props: string | null;
      x: number | null;
      y: number | null;
    }>;
    line_component: Readonly<{
      id: number;
      slide_id: number | null;
      props: string | null;
    }>;
    line_point: Readonly<{
      id: number;
      line_id: number | null;
      x: number | null;
      y: number | null;
    }>;
    theme: Readonly<{
      id: number;
      name: string;
      bg_colorset: string;
      fg_colorset: string;
      fontset: string;
      surface_color: string;
      font_color: string;
    }>;
    recent_color: Readonly<{
      color: number;
      last_used: number | null;
      first_used: number | null;
      theme_id: number | null;
    }>;
    presenter: Readonly<{
      name: number;
      available_transitions: string | null;
      picked_transition: string | null;
    }>;
    selected_slide: Readonly<{
      deck_id: number;
      slide_id: number;
    }>;
    selected_component: Readonly<{
      slide_id: number;
      component_id: number;
      component_type: ComponentType;
    }>;
    undo_stack: Readonly<{
      deck_id: any | null;
      operation: any | null;
      order: any | null;
    }>;
    redo_stack: Readonly<{
      deck_id: any | null;
      operation: any | null;
      order: any | null;
    }>;
  }>
>`
CREATE TABLE IF NOT EXISTS "deck" (
  "id" INT PRIMARY KEY NOT NULL,
  "title" TEXT DEFAULT '',
  "created" INT NOT NULL DEFAULT (strftime('%s','now')),
  "modified" INT NOT NULL DEFAULT (strftime('%s','now')),
  "theme_id" INT,
  "chosen_presenter" TEXT
);

CREATE TABLE IF NOT EXISTS "slide" (
  "id" INT PRIMARY KEY NOT NULL,
  "deck_id" INT,
  "order" TEXT,
  "created" INT NOT NULL DEFAULT (strftime('%s','now')),
  "modified" INT NOT NULL DEFAULT (strftime('%s','now')),
  "x",
  "y",
  "z"
);

CREATE INDEX IF NOT EXISTS "slide_deck_id" ON "slide" ("deck_id", "order");

CREATE TABLE IF NOT EXISTS "text_component" (
  "id" INT PRIMARY KEY NOT NULL,
  "slide_id" INT,
  "text" TEXT,
  "styles" TEXT,
  "x" FLOAT,
  "y" FLOAT,
  "width" INT,
  "height" INT
);

CREATE TABLE IF NOT EXISTS "embed_component" (
  "id" INT PRIMARY KEY NOT NULL,
  "slide_id" INT,
  "src" TEXT,
  "x" FLOAT,
  "y" FLOAT
);

CREATE INDEX IF NOT EXISTS "embed_component_slide_id" ON "embed_component" ("slide_id");

CREATE TABLE IF NOT EXISTS "shape_component" (
  "id" INT PRIMARY KEY NOT NULL,
  "slide_id" INT,
  "type" ShapeType,
  "props" TEXT,
  "x" FLOAT,
  "y" FLOAT
);

CREATE INDEX IF NOT EXISTS "shape_component_slide_id" ON "shape_component" ("slide_id");

CREATE TABLE IF NOT EXISTS "line_component" (
  "id" INT PRIMARY KEY NOT NULL,
  "slide_id" INT,
  "props" TEXT
);

CREATE INDEX IF NOT EXISTS "line_component_slide_id" ON "line_component" ("slide_id");

CREATE TABLE IF NOT EXISTS "line_point" (
  "id" INT PRIMARY KEY NOT NULL,
  "line_id" INT,
  "x" FLOAT,
  "y" FLOAT
);

CREATE INDEX IF NOT EXISTS "line_point_line_id" ON "line_point" ("line_id");

CREATE INDEX IF NOT EXISTS "text_component_slide_id" ON "text_component" ("slide_id");

CREATE TABLE IF NOT EXISTS "theme" (
  "id" INT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL DEFAULT 'unnamed',
  "bg_colorset" TEXT NOT NULL DEFAULT 'default',
  "fg_colorset" TEXT NOT NULL DEFAULT 'default',
  "fontset" TEXT NOT NULL DEFAULT 'default',
  "surface_color" TEXT NOT NULL DEFAULT 'default',
  "font_color" TEXT NOT NULL DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS "recent_color" (
  "color" INT PRIMARY KEY NOT NULL,
  "last_used" INT,
  "first_used" INT,
  "theme_id" INT
);

CREATE TABLE IF NOT EXISTS "presenter" (
  "name" INT PRIMARY KEY NOT NULL,
  "available_transitions" TEXT,
  "picked_transition" TEXT
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
  "deck_id" INT NOT NULL,
  "slide_id" INT NOT NULL,
  primary key ("deck_id", "slide_id")
);

CREATE TABLE IF NOT EXISTS "selected_component" (
  "slide_id" INT NOT NULL,
  "component_id" INT NOT NULL,
  "component_type" ComponentType NOT NULL,
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
`;
