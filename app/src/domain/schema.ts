import { ID_of } from "../id";

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
  "selected_slide",
  "selected_component",
  "undo_stack",
  "redo_stack",
] as const;

// TODO: we shouldn't need to know this detail
// add a `drop crr` cmd
export const crrTables = [
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
];

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
// TODO: remove `colorset` / `fontset` props?
export interface Theme {
  readonly id: ID_of<Theme>;
  readonly name?: string;
  readonly bg_colorset?: string;
  readonly fg_colorset?: string;
  readonly fontset?: string;
  readonly surface_color?: string;
  readonly slide_color?: string;
  readonly font_color?: string;
}

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

export interface DeckIndex {
  getSuggestions(q: string): { id: ID_of<Slide>; title: string }[];
}

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
