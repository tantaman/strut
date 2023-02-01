import { Ctx, first, firstPick, SQL, useAsyncQuery } from "@vlcn.io/react";
import { ID_of } from "../id";
import {
  Deck,
  Presenter,
  Slide,
  TableName,
  TextComponent,
  Theme,
} from "./schema";

export type Query<R, M = R[]> =
  | [Ctx, SQL<R>, any[]]
  | [Ctx, SQL<R>, any[], (x: R[]) => M];

const queries = {
  // TODO: we can collapse all "same calls" in the same tick. to just do 1 query
  // e.g. if 50 components all want the same data can just collapse to 1 query.
  // DataLoader pattern.
  // do the data loader pattern at the db wrapper level?
  // and/or prepared statement level?
  // we enqueue.. we can check if anyone ahead of us in the queue is fulfilling our result.
  // if so, we return that promise instead of enqueueing a new one.
  canUndo: (ctx: Ctx, id: ID_of<Deck>) =>
    useAsyncQuery(
      ctx,
      /*sql*/ `SELECT 1 FROM undo_stack WHERE deck_id = ? LIMIT 1`,
      [id],
      firstPick
    ),

  canRedo: (ctx: Ctx, id: ID_of<Deck>) =>
    [
      ctx,
      /*sql*/ `SELECT 1 FROM undo_stack WHERE deck_id = ? LIMIT 1`,
      [id],
      firstPick,
    ] as Query<boolean, boolean | undefined>,

  slides: (ctx: Ctx, id: ID_of<Deck>) =>
    [
      ctx,
      /*sql*/ `SELECT * FROM slide WHERE deck_id = ? ORDER BY "order" ASC`,
      [id],
    ] as Query<Slide>,

  slideIds: (ctx: Ctx, id: ID_of<Deck>) =>
    [
      ctx,
      /*sql*/ `SELECT "id" FROM "slide" WHERE "deck_id" = ? ORDER BY "order" ASC`,
      [id],
      (x: [ID_of<Slide>][]) => x.map((x) => x[0]),
    ] as Query<[ID_of<Slide>], ID_of<Slide>[]>,

  chosenPresenter: (ctx: Ctx, id: ID_of<Deck>) =>
    [
      ctx,
      /*sql*/ `SELECT "presenter".* FROM "presenter" JOIN "deck" ON deck.chosen_presenter = presenter.name WHERE deck.id = ?`,
      [id],
      first,
    ] as Query<Presenter, Presenter>,

  selectedSlides: (ctx: Ctx, id: ID_of<Deck>) =>
    [
      ctx,
      /*sql*/ `SELECT "slide_id" FROM "selected_slide" WHERE "deck_id" = ?`,
      [id],
      (x: [ID_of<Slide>][]) => new Set(x.map((x) => x[0])),
    ] as Query<[ID_of<Slide>], Set<ID_of<Slide>>>,

  mostRecentlySelectedSlide: (ctx: Ctx, id: ID_of<Deck>) =>
    [
      ctx,
      /*sql*/ `SELECT "slide_id" FROM "selected_slide" WHERE "deck_id" = ? ORDER BY "rowid" DESC LIMIT 1`,
      [id],
      firstPick,
    ] as Query<[ID_of<Slide>], ID_of<Slide> | undefined>,

  recentColors: (ctx: Ctx, id: ID_of<Theme> | undefined) =>
    [
      ctx,
      /*sql*/ `SELECT "color" FROM "recent_color" WHERE "theme_id" = ?`,
      [id == null ? null : id],
      (x: [string][]) => x.map((x) => x[0]),
    ] as Query<[string], string[]>,

  theme: (ctx: Ctx, id: ID_of<Theme>) =>
    [ctx, /*sql*/ `SELECT * FROM "theme" WHERE "id" = ?`, [id]] as Query<Theme>,

  themeFromDeck: (ctx: Ctx, id: ID_of<Deck>) =>
    [
      ctx,
      /*sql*/ `SELECT theme.* FROM "theme" JOIN "deck" ON theme.id = deck.theme_id WHERE deck.id = ?`,
      [id],
      first,
    ] as Query<Theme, Theme | undefined>,

  textComponents: (ctx: Ctx, id: ID_of<Slide>) =>
    [
      ctx,
      /*sql*/ `SELECT * FROM "text_component" WHERE "slide_id" = ?`,
      [id],
    ] as Query<TextComponent, TableName>,
} as const;

export default queries;
