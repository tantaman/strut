import { Ctx, first } from "../hooks";
import { ID_of } from "../id";
import fns from "./fns";
import { Deck, Operation, UndoStack } from "./schema";

const mutations = {
  async undo(ctx: Ctx, deckId: ID_of<Deck>) {
    const item = first(
      await ctx.db.execO<UndoStack>(
        "SELECT * FROM undo_stack WHERE deck_id = ? ORDER BY order DESC LIMIT 1",
        [deckId]
      )
    );
    if (item) {
      await ctx.db.exec(
        "DELETE FROM undo_stack WHERE deck_id = ? AND order = ?",
        [deckId, item.order]
      );
      const op = fns.decodeOperation(item.operation);
    }
  },

  async redo(ctx: Ctx, deckId: ID_of<Deck>) {
    const item = first(
      await ctx.db.execO<UndoStack>(
        "SELECT * FROM redo_stack WHERE deck_id = ? ORDER BY order ASC LIMIT 1",
        [deckId]
      )
    );
    if (item) {
      await ctx.db.exec(
        "DELETE FROM redo_stack WHERE deck_id = ? AND order = ?",
        [deckId, item.order]
      );
      const op = fns.decodeOperation(item.operation);
      await mutations.applyOperation(ctx, op);
    }
  },

  toggleOpenType() {},

  toggleDrawing() {},

  async applyOperation(ctx: Ctx, op: Operation) {
    // get mutation from op.name
    // apply mutations from op.args and current ctx
  },
};

export default mutations;
