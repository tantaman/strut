import { Operation, Theme, Transition } from "./schema";
import { toDOM } from "./Document";

const fns = {
  decodeOperation(op: string): Operation {
    return {};
  },

  decodeTransitions(transitions?: string): Transition[] {
    return [];
  },

  getTextColorStyle(
    previewTheme: Theme,
    pickedTheme?: Theme
  ): string | undefined {
    return undefined;
  },

  mdStringAsDom(content: string) {
    return toDOM(content);
  },
};

export default fns;
