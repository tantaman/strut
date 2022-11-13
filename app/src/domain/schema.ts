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
  /*sql*/ `CREATE TABLE IF NOT EXISTS "selected_slide" ("deck_id", "slide_id", "cnt" autoincrement, primary key ("deck_id", "slide_id"));`,
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
  "selected_slide",
  "selected_component",
  "undo_stack",
  "redo_stack",
  "recent_opens",
] as const;

export type TableName = typeof tableNames[number];

// See https://github.com/microsoft/TypeScript/issues/34777
// as to why we use `readonly` explicitly instead of ReadOnly<T>
type ComponentBase = {
  readonly slide_id: ID_of<Slide>;
  readonly x?: number;
  readonly y?: number;
};

export type Deck = {
  readonly id: ID_of<Deck>;
  readonly title?: string;
  readonly created?: number;
  readonly modified?: number;
  readonly theme_id?: ID_of<Theme>;
  readonly chosen_presenter?: string; // name of Presenter type
};

// TODO: decoding methods in `queries`
export type Theme = {
  readonly id: ID_of<Theme>;
  readonly name: string;
  readonly bg_colorset: string;
  readonly fg_colorset: string;
  readonly fontset: string;
};

export type Slide = {
  readonly id: ID_of<Slide>;
  readonly deck_id?: ID_of<Deck>;
  readonly order?: number;
  readonly created?: number;
  readonly modified?: number;
  readonly x?: number;
  readonly y?: number;
  readonly z?: number;
};

export type TextComponent = {
  readonly id: ID_of<TextComponent>;
  readonly text?: string;
  readonly styles?: string;
} & ComponentBase;

export type EmbedComponent = {
  readonly id: ID_of<EmbedComponent>;
  readonly src?: string;
} & ComponentBase;

export type ShapeComponent = {
  readonly id: ID_of<ShapeComponent>;
  readonly type?: "ellipse" | "rectangle" | "triangle" | "hexagon" | "octagon";
  readonly props?: string;
} & ComponentBase;

export type LineComponent = {
  readonly id: ID_of<LineComponent>;
  readonly slide_id?: ID_of<Slide>;
  readonly props?: string;
};

export type LinePoint = {
  readonly id: ID_of<LinePoint>;
  readonly line_id?: ID_of<LineComponent>;
  readonly x?: number;
  readonly y?: number;
};

export type Presenter = {
  readonly name: string;
  readonly available_transitions?: string;
  readonly picked_transition?: string;
};

export type Markdown = {
  readonly slide_id: ID_of<Slide>;
  readonly content?: string;
};

// === Non-Replicateds

export type SelectSlides = {
  readonly deck_id: ID_of<Deck>;
  readonly slide_id: ID_of<Slide>;
};

export type SelectedComponents = {
  readonly slide_id: ID_of<Slide>;
  readonly component_id: ID_of<
    TextComponent | EmbedComponent | ShapeComponent | LineComponent
  >;
  readonly component_type:
    | "TextComponent"
    | "EmbedComponent"
    | "ShapeComponent"
    | "LineComponent";
};

export type UndoStack = {
  readonly deck_id: ID_of<Deck>;
  readonly operation: string;
  readonly order: number;
};

export type RedoStack = {
  readonly deck_id: ID_of<Deck>;
  readonly operation: string;
  readonly order: number;
};

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

// rm readonly from ephemeral
export type EphemeralTheme = Theme;

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
