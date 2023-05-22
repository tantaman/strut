import { Operation, Theme, Transition } from "./schema";
import { toDOM } from "./Document";

const fns = {
  decodeOperation(_op: string): Operation {
    return {};
  },

  decodeTransitions(_transitions?: string): Transition[] {
    return [];
  },

  getTextColorStyle(
    _previewTheme: Theme,
    _pickedTheme?: Theme
  ): string | undefined {
    return undefined;
  },

  getSlideColorStyle(
    _previewTheme: Theme,
    _pickedTheme?: Theme
  ): string | undefined {
    return undefined;
  },

  getFontClass(_previewTheme: Theme, _pickedTheme?: Theme): string | undefined {
    return undefined;
  },

  getSurfaceColorStyle(
    _previewTheme: Theme,
    _pickedTheme?: Theme
  ): string | undefined {
    return undefined;
  },

  mdStringAsDom(content: string) {
    return toDOM(content);
  },
};

export default fns;
