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
import {
  AnyComponentID,
  Deck,
  EmbedComponent,
  Presenter,
  Slide,
  TextComponent,
  Theme,
} from "./schema";

export type Query<R, M = R[]> =
  | [Ctx, SQL<R>, any[]]
  | [Ctx, SQL<R>, any[], (x: R[]) => M];

// @ts-ignore
type Result<T> = any;

const queries = {
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
    useQuery<{ id: IID_of<Slide> }, IID_of<Slide>[]>(
      ctx,
      /*sql*/ `SELECT "id" FROM "slide" WHERE "deck_id" = ? ORDER BY "order" ASC`,
      [id],
      pick
    ),

  firstSlideId: (ctx: Ctx, id: IID_of<Deck>) =>
    useQuery<{ id: IID_of<Slide> }, IID_of<Slide> | undefined>(
      ctx,
      /*sql*/ `SELECT "id" FROM "slide" WHERE "deck_id" = ? ORDER BY "order" ASC LIMIT 1`,
      [id],
      firstPick
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
      (x: Result<"slide_id">[]) =>
        new Set(x.map((x: Result<"slide_id">) => x.slide_id))
    ),

  selectedComponentIds: (ctx: Ctx, id: IID_of<Slide>) =>
    useRangeQuery<AnyComponentID, Set<AnyComponentID>>(
      ctx,
      /*sql*/ `SELECT "component_id" FROM "selected_component" WHERE "slide_id" = ? ORDER BY "component_id" ASC`,
      [id],
      (x: any) => new Set(x.map((x: any) => x.component_id))
    ),

  componentBoxes: (ctx: Ctx, id: IID_of<Slide>) =>
    useQuery<{
      id: AnyComponentID;
      left: number;
      top: number;
      width: number;
      height: number;
    }>(
      ctx,
      /*sql*/ `SELECT "id", "x" as "left", "y" as "top", "width", "height" FROM text_component WHERE "slide_id" = ?`,
      [id]
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

  embedComponentIds: (ctx: Ctx, id: IID_of<Slide>) =>
    useQuery<IID_of<EmbedComponent>>(
      ctx,
      /*sql*/ `SELECT id FROM "embed_component" WHERE "slide_id" = ? ORDER BY id ASC`,
      [id],
      pick
    ),

  textComponentIds: (ctx: Ctx, id: IID_of<Slide>) =>
    useQuery<IID_of<TextComponent>>(
      ctx,
      /*sql*/ `SELECT id FROM "text_component" WHERE "slide_id" = ? ORDER BY id ASC`,
      [id],
      pick
    ),
  textComponent: (ctx: Ctx, id: IID_of<TextComponent>) =>
    usePointQuery<TextComponent, TextComponent | undefined>(
      ctx,
      id as any,
      /*sql*/ `SELECT * FROM "text_component" WHERE "id" = ?`,
      [id],
      first
    ),
  // TODO: usePointQuery doesn't always reactively update?
  embedComponent: (ctx: Ctx, id: IID_of<EmbedComponent>) =>
    useQuery<EmbedComponent, EmbedComponent | undefined>(
      ctx,
      /*sql*/ `SELECT * FROM "embed_component" WHERE "id" = ?`,
      [id],
      first
    ),
} as const;

export default queries;
