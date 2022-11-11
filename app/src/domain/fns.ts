import { Operation, Transition } from "./schema";

const fns = {
  decodeOperation(op: string): Operation {
    return {};
  },

  decodeTransitions(transitions?: string): Transition[] {
    return [];
  },
};

export default fns;
