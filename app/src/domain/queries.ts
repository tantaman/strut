import { Ctx } from "../hooks";
import { ID_of } from "../id";
import { Deck } from "./schema";

const queries = {
  canUndo: (ctx: Ctx, id: ID_of<Deck>) =>
    [
      ctx,
      ["undo_stack"],
      "SELECT 1 FROM undo_stack WHERE deck_id = ? LIMIT 1",
      [id],
    ] as const,
  canRedo: (ctx: Ctx, id: ID_of<Deck>) =>
    [
      ctx,
      ["redo_stack"],
      "SELECT 1 FROM undo_stack WHERE deck_id = ? LIMIT 1",
      [id],
    ] as const,
};

export default queries;
