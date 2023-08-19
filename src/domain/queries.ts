import {
  CtxAsync as Ctx,
  first,
  pick,
  useQuery,
  usePointQuery,
} from "@vlcn.io/react";
import { IID_of, Opaque } from "../id";
import { EmbedComponent, Slide, TextComponent } from "./schema";

type SQL<R> = Opaque<R>;
export type Query<R, M = R[]> =
  | [Ctx, SQL<R>, any[]]
  | [Ctx, SQL<R>, any[], (x: R[]) => M];

// @ts-ignore
type Result<T> = any;

const queries = {
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
