export * from "../schemas/StrutSchemaType.js";
import { Slide } from "../schemas/StrutSchemaType.js";
import { IID_of } from "../id.js";
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
