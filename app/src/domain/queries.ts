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

  slides: (ctx: Ctx, id: ID_of<Deck>) =>
    [
      ctx,
      ["slide"],
      'SELECT * FROM slide WHERE deck_id = ? ORDER BY "order" ASC',
      [id],
    ] as const,
  chosenPresenter: (ctx: Ctx, id: ID_of<Deck>) =>
    [
      ctx,
      ["deck", "presenter"],
      "SELECT presenter.* FROM presenter, deck WHERE deck.id = ? AND presenter.name = deck.chosen_presenter",
      [id],
    ] as const,
};

export default queries;
