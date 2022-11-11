import { Ctx } from "../hooks";
import { ID_of } from "../id";
import { Deck } from "./schema";

const queries = {
  // TODO: we can collapse all "same calls" in the same tick. to just do 1 query
  // e.g. if 50 components all want the same data can just collapse to 1 query.
  // DataLoader pattern.
  // do the data loader pattern at the db wrapper level?
  // and/or prepared statement level?
  // we enqueue.. we can check if anyone ahead of us in the queue is fulfilling our result.
  // if so, we return that promise instead of enqueueing a new one.
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
  selectedSlides: (ctx: Ctx, id: ID_of<Deck>) => [],
};

export default queries;
