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
      // TODO: that should be pushed onto redo stack!
      const op = fns.decodeOperation(item.operation);
      // await mutations.revertOperation(ctx, op);
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

  async setTransitionType(ctx: Ctx, presenter: string, transitionType: string) {
    // TODO encode an operation for undo/redo too
    await ctx.db.exec(
      "UPDATE presenter SET transition_type = ? WHERE name = ?",
      [transitionType, presenter]
    );
  },

  async applyOperation(ctx: Ctx, op: Operation) {
    // get mutation from op.name
    // apply mutations from op.args and current ctx
    // TODO: could also look into the sqlite undo/redo as triggers design
  },
};

export default mutations;
