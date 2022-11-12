import { Operation, Theme, Transition } from "./schema";

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
};

export default fns;
