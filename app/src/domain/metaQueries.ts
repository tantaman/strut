import { CtxAsync as Ctx, useQuery } from "@vlcn.io/react";

export type MetaDeck = {
  title: string;
  dbid: Uint8Array;
  deck_id: bigint | null;
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
