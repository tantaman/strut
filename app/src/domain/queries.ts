import {
  CtxAsync as Ctx,
  first,
  firstPick,
  pick,
  SQL,
  useQuery,
  useRangeQuery,
  usePointQuery,
} from "@vlcn.io/react";
import { IID_of } from "../id";
import { Deck, Presenter, Slide, TextComponent, Theme } from "./schema";

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
  canUndo: (ctx: Ctx, id: IID_of<Deck>) =>
    useQuery<{ exists: number }, boolean | undefined>(
      ctx,
      /*sql*/ `SELECT 1 as "exists" FROM undo_stack WHERE deck_id = ? LIMIT 1`,
      [id],
      firstPick
    ),

  canRedo: (ctx: Ctx, id: IID_of<Deck>) =>
    useQuery<{ exists: number }, boolean | undefined>(
      ctx,
      /*sql*/ `SELECT 1 as "exists" FROM undo_stack WHERE deck_id = ? LIMIT 1`,
      [id],
      firstPick
    ),

  slideIds: (ctx: Ctx, id: IID_of<Deck>) =>
    useRangeQuery<{ id: IID_of<Slide> }>(
      ctx,
      /*sql*/ `SELECT "id" FROM "slide" WHERE "deck_id" = ? ORDER BY "order" ASC`,
      [id],
      pick
    ),

  chosenPresenter: (ctx: Ctx, id: IID_of<Deck>) =>
    useQuery<Presenter, Presenter | undefined>(
      ctx,
      /*sql*/ `SELECT "presenter".* FROM "presenter" JOIN "deck" ON deck.chosen_presenter = presenter.name WHERE deck.id = ?`,
      [id],
      first
    ),

  selectedSlideIds: (ctx: Ctx, id: IID_of<Deck>) =>
    useRangeQuery<IID_of<Slide>, Set<IID_of<Slide>>>(
      ctx,
      /*sql*/ `SELECT "slide_id" FROM "selected_slide" WHERE "deck_id" = ?`,
      [id],
      (x: any) => new Set(x.map((x: any) => x.slide_id))
    ),

  mostRecentlySelectedSlide: (ctx: Ctx, id: IID_of<Deck>) =>
    useRangeQuery<{ slide_id: IID_of<Slide> }, IID_of<Slide> | undefined>(
      ctx,
      /*sql*/ `SELECT "slide_id" FROM "selected_slide" WHERE "deck_id" = ? ORDER BY "rowid" DESC LIMIT 1`,
      [id],
      firstPick
    ),

  recentColors: (ctx: Ctx, id: IID_of<Theme> | undefined) =>
    useQuery<{ color: string }, string[]>(
      ctx,
      /*sql*/ `SELECT "color" FROM "recent_color" WHERE "theme_id" = ?`,
      [id == null ? null : id],
      pick
    ),

  theme: (ctx: Ctx, id: IID_of<Theme>) =>
    useQuery<Theme>(ctx, /*sql*/ `SELECT * FROM "theme" WHERE "id" = ?`, [id]),

  themeFromDeck: (ctx: Ctx, id: IID_of<Deck>) =>
    useQuery<Theme, Theme | undefined>(
      ctx,
      /*sql*/ `SELECT theme.* FROM "theme" JOIN "deck" ON theme.id = deck.theme_id WHERE deck.id = ?`,
      [id],
      first
    ),

  themeIdFromDeck: (ctx: Ctx, id: IID_of<Deck>) =>
    usePointQuery<Theme, IID_of<Theme> | undefined>(
      ctx,
      id as any, // todo: move iid code to vlcn.io
      /*sql*/ `SELECT theme_id FROM "deck" WHERE id = ?`,
      [id],
      firstPick
    ),

  pointTheme: (ctx: Ctx, id: IID_of<Theme>) =>
    useQuery<Theme, Theme | undefined>(
      ctx,
      `SELECT * FROM "theme" WHERE id = ?`,
      [id],
      first
    ),

  textComponents: (ctx: Ctx, id: IID_of<Slide>) =>
    useQuery<TextComponent>(
      ctx,
      /*sql*/ `SELECT * FROM "text_component" WHERE "slide_id" = ?`,
      [id]
    ),
} as const;

export default queries;
