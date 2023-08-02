import { IID_of } from "../id";
import { StrutSchema } from "@strut/schema";
import { RecordTypes } from "@vlcn.io/typed-sql";

export type StrutRecords = RecordTypes<typeof StrutSchema>;

export type Slide = StrutRecords["slide"];
export type Deck = StrutRecords["deck"];
export type EmbedComponent = StrutRecords["embed_component"];
export type Presenter = StrutRecords["presenter"];
export type TextComponent = StrutRecords["text_component"];
export type Theme = StrutRecords["theme"];
export type LineComponent = StrutRecords["line_component"];
export type ShapeComponent = StrutRecords["shape_component"];
export type UndoStack = StrutRecords["undo_stack"];
export type RedoStack = StrutRecords["redo_stack"];
// === Ephemerals

export interface DeckIndex {
  getSuggestions(q: string): { id: IID_of<Slide>; title: string }[];
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
