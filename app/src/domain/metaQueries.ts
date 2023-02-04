import { CtxAsync as Ctx, useQuery } from "@vlcn.io/react";
import { IID_of } from "../id";
import { Deck } from "./schema";

export type MetaDeck = {
  title: string;
  dbid: Uint8Array;
  deck_id: IID_of<Deck> | null;
  last_modified: number;
  is_dirty: boolean;
};

const metaQueries = {
  decks: (ctx: Ctx) =>
    useQuery<MetaDeck>(
      ctx,
      /*sql*/ `SELECT * FROM "deck_map" ORDER BY "last_modified" DESC`
    ),
} as const;

export default metaQueries;
