import { CtxAsync as Ctx, useQuery } from "@vlcn.io/react";

export type MetaDeck = {
  title: string;
  dbid: Uint8Array;
  lastModified: number;
  isDirty: boolean;
};

const metaQueries = {
  decks: (ctx: Ctx) =>
    useQuery<MetaDeck>(
      ctx,
      /*sql*/ `SELECT * FROM "deck_map" ORDER BY "lastModified" DESC`
    ),
} as const;

export default metaQueries;
