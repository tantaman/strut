import { Ctx, Query } from "../hooks";
import { ID_of } from "../id";
import { Deck, Markdown, Presenter, Slide, TableName, Theme } from "./schema";

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
      /*sql*/ `SELECT 1 FROM undo_stack WHERE deck_id = ? LIMIT 1`,
      [id],
    ] as Query<boolean, TableName>,
  canRedo: (ctx: Ctx, id: ID_of<Deck>) =>
    [
      ctx,
      ["redo_stack"],
      /*sql*/ `SELECT 1 FROM undo_stack WHERE deck_id = ? LIMIT 1`,
      [id],
    ] as Query<boolean, TableName>,

  slides: (ctx: Ctx, id: ID_of<Deck>) =>
    [
      ctx,
      ["slide"],
      /*sql*/ `SELECT * FROM slide WHERE deck_id = ? ORDER BY "order" ASC`,
      [id],
    ] as Query<Slide, TableName>,

  slideIds: (ctx: Ctx, id: ID_of<Deck>) =>
    [
      ctx,
      ["slide"],
      /*sql*/ `SELECT id FROM slide WHERE deck_id = ? ORDER BY "order" ASC`,
      [id],
      (x: [ID_of<Slide>][]) => x.map((x) => x[0]),
    ] as Query<[ID_of<Slide>], TableName, ID_of<Slide>[]>,

  chosenPresenter: (ctx: Ctx, id: ID_of<Deck>) =>
    [
      ctx,
      ["deck", "presenter"],
      /*sql*/ `SELECT presenter.* FROM presenter, deck WHERE deck.id = ? AND presenter.name = deck.chosen_presenter`,
      [id],
    ] as Query<Presenter, TableName>,

  selectedSlides: (ctx: Ctx, id: ID_of<Deck>) =>
    [
      ctx,
      ["slide"],
      /*sql*/ `SELECT slide_id FROM selected_slide WHERE deck_id = ?`,
      [id],
      (x: [ID_of<Slide>][]) => new Set(x.map((x) => x[0])),
    ] as Query<[ID_of<Slide>], TableName, Set<ID_of<Slide>>>,

  recentColors: (ctx: Ctx, id: ID_of<Theme>) =>
    [
      ctx,
      ["recent_color"],
      /*sql*/ `SELECT color FROM recent_color WHERE theme_id = ?`,
      [id],
      (x: [string][]) => x.map((x) => x[0]),
    ] as Query<[string], TableName, string[]>,

  theme: (ctx: Ctx, id: ID_of<Theme>) =>
    [ctx, ["theme"], /*sql*/ `SELECT * FROM theme WHERE id = ?`, [id]] as Query<
      Theme,
      TableName
    >,

  themeFromDeck: (ctx: Ctx, id: ID_of<Deck>) =>
    [
      ctx,
      ["theme", "deck"],
      /*sql*/ `SELECT theme.* FROM theme JOIN deck ON theme.id = deck.theme_id WHERE deck.id = ?`,
      [id],
    ] as Query<Theme, TableName>,

  markdown: (ctx: Ctx, id: ID_of<Slide>) =>
    [
      ctx,
      ["markdown"],
      /*sql*/ `SELECT * FROM markdown WHERE slide_id = ?`,
      [id],
    ] as Query<Markdown, TableName>,
} as const;

export default queries;
