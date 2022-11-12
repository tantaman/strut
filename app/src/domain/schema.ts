import { Editor } from "@tiptap/core";
import { Ctx } from "../hooks";
import { ID_of } from "../id";
import { Transaction } from "prosemirror-state";

export const tables = [
  /*sql*/ `CREATE TABLE IF NOT EXISTS "deck" ("id" primary key, "title", "created", "modified", "theme_id", "chosen_presenter");`,
  /*sql*/ `CREATE TABLE IF NOT EXISTS "slide" ("id" primary key, "deck_id", "order", "created", "modified", "x", "y", "z");`,
  /*sql*/ `CREATE TABLE IF NOT EXISTS "text_component" ("id" primary key, "slide_id", "text", "styles", "x", "y");`,
  /*sql*/ `CREATE TABLE IF NOT EXISTS "embed_component" ("id" primary key, "slide_id", "src", "x", "y");`,
  /*sql*/ `CREATE TABLE IF NOT EXISTS "shape_component" ("id" primary key, "slide_id", "type", "props", "x", "y");`,
  /*sql*/ `CREATE TABLE IF NOT EXISTS "line_component" ("id" primary key, "slide_id", "props");`,
  /*sql*/ `CREATE TABLE IF NOT EXISTS "line_point" ("id" primary key, "line_id", "x", "y");`,
  /*sql*/ `CREATE TABLE IF NOT EXISTS "theme" ("id" primary key, "name", "bg_colorset", "fg_colorset", "fontset");`,
  /*sql*/ `CREATE TABLE IF NOT EXISTS "recent_color" ("color" primary key, "last_used", "first_used", "theme_id");`,
  /*sql*/ `CREATE TABLE IF NOT EXISTS "presenter" ("name" primary key, "available_transitions", "picked_transition");`,
  /*sql*/ `CREATE TABLE IF NOT EXISTS "markdown" ("slide_id" primary key, "content");`,

  // Make the above tables collaborative and replicated by upgrading them to CRRs
  /*sql*/ `SELECT crsql_as_crr('deck');`,
  /*sql*/ `SELECT crsql_as_crr('slide');`,
  /*sql*/ `SELECT crsql_as_crr('text_component');`,
  /*sql*/ `SELECT crsql_as_crr('embed_component');`,
  /*sql*/ `SELECT crsql_as_crr('shape_component');`,
  /*sql*/ `SELECT crsql_as_crr('line_component');`,
  /*sql*/ `SELECT crsql_as_crr('line_point');`,
  /*sql*/ `SELECT crsql_as_crr('theme');`,
  /*sql*/ `SELECT crsql_as_crr('recent_color');`,
  /*sql*/ `SELECT crsql_as_crr('presenter');`,
  /*sql*/ `SELECT crsql_as_crr('markdown');`,

  // These tables are local and do not replicate. Don't make them CRRs
  /*sql*/ `CREATE TABLE IF NOT EXISTS "selected_slide" ("deck_id", "slide_id", primary key ("deck_id", "slide_id"));`,
  /*sql*/ `CREATE TABLE IF NOT EXISTS "selected_component" ("slide_id", "component_id", "component_type", primary key ("slide_id", "component_id"));`,
  /*sql*/ `CREATE TABLE IF NOT EXISTS "undo_stack" ("deck_id", "operation", "order", primary key ("deck_id", "order"));`,
  /*sql*/ `CREATE TABLE IF NOT EXISTS "redo_stack" ("deck_id", "operation", "order", primary key ("deck_id", "order"));`,
  /*sql*/ `CREATE TABLE IF NOT EXISTS "recent_open" ("deck_id" primary key, "timestamp");`,
];

export const tableNames = [
  "deck",
  "slide",
  "text_component",
  "embed_component",
  "shape_component",
  "line_component",
  "line_point",
  "theme",
  "recent_color",
  "presenter",
  "markdown",
  "selected_slides",
  "selected_components",
  "undo_stack",
  "redo_stack",
  "recent_opens",
];

type ComponentBase = Readonly<{
  slide_id: ID_of<Slide>;
  x?: number;
  y?: number;
}>;

export type Deck = Readonly<{
  id: ID_of<Deck>;
  title?: string;
  created?: number;
  modified?: number;
  theme_id?: ID_of<Theme>;
  chosen_presenter?: string; // name of Presenter type
}>;

// TODO: decoding methods in `queries`
export type Theme = Readonly<{
  id: ID_of<Theme>;
  name: string;
  bg_colorset: string;
  fg_colorset: string;
  fontset: string;
}>;

export type Slide = Readonly<{
  id: ID_of<Slide>;
  deck_id?: ID_of<Deck>;
  order?: number;
  created?: number;
  modified?: number;
  x?: number;
  y?: number;
  z?: number;
}>;

export type TextComponent = Readonly<
  {
    id: ID_of<TextComponent>;
    text?: string;
    styles?: string;
  } & ComponentBase
>;

export type EmbedComponent = Readonly<
  {
    id: ID_of<EmbedComponent>;
    src?: string;
  } & ComponentBase
>;

export type ShapeComponent = Readonly<
  {
    id: ID_of<ShapeComponent>;
    type?: "ellipse" | "rectangle" | "triangle" | "hexagon" | "octagon";
    props?: string;
  } & ComponentBase
>;

export type LineComponent = Readonly<{
  id: ID_of<LineComponent>;
  slide_id?: ID_of<Slide>;
  props?: string;
}>;

export type LinePoint = Readonly<{
  id: ID_of<LinePoint>;
  line_id?: ID_of<LineComponent>;
  x?: number;
  y?: number;
}>;

export type Presenter = Readonly<{
  name: string;
  available_transitions?: string;
  picked_transition?: string;
}>;

export type Markdown = Readonly<{
  slide_id: ID_of<Slide>;
  content?: string;
}>;

// === Non-Replicateds

export type SelectSlides = Readonly<{
  deck_id: ID_of<Deck>;
  slide_id: ID_of<Slide>;
}>;

export type SelectedComponents = Readonly<{
  slide_id: ID_of<Slide>;
  component_id: ID_of<
    TextComponent | EmbedComponent | ShapeComponent | LineComponent
  >;
  component_type:
    | "TextComponent"
    | "EmbedComponent"
    | "ShapeComponent"
    | "LineComponent";
}>;

export type UndoStack = Readonly<{
  deck_id: ID_of<Deck>;
  operation: string;
  order: number;
}>;

export type RedoStack = Readonly<{
  deck_id: ID_of<Deck>;
  operation: string;
  order: number;
}>;

export type Operation = {};

// === Ephemerals

// AppState is ephemeral
// created for each new session
// needs to be bindable given these states change
export type AppState = {
  ctx: Ctx;
  editor_mode: "slide" | "layout";
  current_deck_id: ID_of<Deck>;
  open_type: boolean;
  drawing: boolean;
  authoringState: AuthoringState;
  drawingInteractionState: DrawingInteractionState;
  previewTheme: Theme;

  setEditorMode(mode: AppState["editor_mode"]): void;
  toggleOpenType(): void;
};

export type DrawingInteractionState = {
  currentTool: Tool;

  activateTool: (t: Tool) => void;
};

export type AuthoringState = {
  editor: Editor;
  transaction: Transaction;

  updateEditor: (editor: Editor) => void;
  updateTransaction: (transaction: Transaction) => void;
};

export type Tool =
  | "selection"
  | "rectangle"
  | "diamond"
  | "ellipse"
  | "arrow"
  | "line"
  | "freedraw"
  | "text";

export type Transition = {
  name: string;
};
