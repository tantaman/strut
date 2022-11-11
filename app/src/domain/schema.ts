import { ID_of } from "../id";

export const tables = [
  `CREATE TABLE IF NOT EXISTS "deck" ("id" primary key, "title", "created", "modified", "theme_id");`,
  `CREATE TABLE IF NOT EXISTS "slide" ("id" primary key, "deck_id", "order", "created", "modified", "x", "y", "z");`,
  `CREATE TABLE IF NOT EXISTS "text_component" ("id" primary key, "slide_id", "text", "styles", "x", "y");`,
  `CREATE TABLE IF NOT EXISTS "embed_component" ("id" primary key, "slide_id", "src", "x", "y");`,
  `CREATE TABLE IF NOT EXISTS "shape_component" ("id" primary key, "slide_id", "type", "props", "x", "y");`,
  `CREATE TABLE IF NOT EXISTS "line_component" ("id" primary key, "slide_id", "props");`,
  `CREATE TABLE IF NOT EXISTS "line_point" ("id" primary key, "line_id", "x", "y");`,
  `CREATE TABLE IF NOT EXISTS "theme" ("id" primary key, "props");`,

  // Make these tables collaborative
  "SELECT crsql_as_crr('deck');",
  "SELECT crsql_as_crr('slide');",
  "SELECT crsql_as_crr('text_component');",
  "SELECT crsql_as_crr('embed_component');",
  "SELECT crsql_as_crr('shape_component');",
  "SELECT crsql_as_crr('line_component');",
  "SELECT crsql_as_crr('line_point');",
  "SELECT crsql_as_crr('theme');",

  // These tables are local to the given instance and should never replicate
  `CREATE TABLE IF NOT EXISTS "app_state" ("id" primary key, "editor_mode", "current_deck_id", "open_type", "drawing");`,
  `CREATE TABLE IF NOT EXISTS "selected_slides" ("deck_id", "slide_id", primary key ("deck_id", "slide_id"));`,
  `CREATE TABLE IF NOT EXISTS "selected_components" ("slide_id", "component_id", "component_type", primary key ("slide_id", "component_id"));`,
  `CREATE TABLE IF NOT EXISTS "undo_stack" ("deck_id", "operation", "order", primary key ("deck_id", "order"));`,
  `CREATE TABLE IF NOT EXISTS "redo_stack" ("deck_id", "operation", "order", primary key ("deck_id", "order"));`,
];

type ComponentBase = {
  slide_id: ID_of<Slide>;
  x?: number;
  y?: number;
};

export type Deck = {
  id: ID_of<Deck>;
  title?: string;
  created?: number;
  modified?: number;
  theme_id?: ID_of<Theme>;
};

// TODO: decoding methods in `queries`
export type Theme = {
  id: ID_of<Theme>;
  props?: string;
};

export type Slide = {
  id: ID_of<Slide>;
  deck_id?: ID_of<Deck>;
  order?: number;
  created?: number;
  modified?: number;
  x?: number;
  y?: number;
  z?: number;
};

export type TextComponent = {
  id: ID_of<TextComponent>;
  text?: string;
  styles?: string;
} & ComponentBase;

export type EmbedComponent = {
  id: ID_of<EmbedComponent>;
  src?: string;
} & ComponentBase;

export type ShapeComponent = {
  id: ID_of<ShapeComponent>;
  type?: "ellipse" | "rectangle" | "triangle" | "hexagon" | "octagon";
  props?: string;
} & ComponentBase;

export type LineComponent = {
  id: ID_of<LineComponent>;
  slide_id?: ID_of<Slide>;
  props?: string;
};

export type LinePoint = {
  id: ID_of<LinePoint>;
  line_id?: ID_of<LineComponent>;
  x?: number;
  y?: number;
};

export type AppState = {
  id: ID_of<AppState>;
  editor_mode: "slide" | "layout";
  current_deck_id: ID_of<Deck>;
  open_type: boolean;
  drawing: boolean;
};

export type Bus = {
  authoringState: {};
};

export type SelectSlides = {
  deck_id: ID_of<Deck>;
  slide_id: ID_of<Slide>;
};

export type SelectedComponents = {
  slide_id: ID_of<Slide>;
  component_id: ID_of<
    TextComponent | EmbedComponent | ShapeComponent | LineComponent
  >;
  component_type:
    | "TextComponent"
    | "EmbedComponent"
    | "ShapeComponent"
    | "LineComponent";
};

export type UndoStack = {
  deck_id: ID_of<Deck>;
  operation: string;
  order: number;
};

export type RedoStack = {
  deck_id: ID_of<Deck>;
  operation: string;
  order: number;
};

export type Operation = {};
