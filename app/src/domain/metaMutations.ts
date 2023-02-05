import { CtxAsync } from "@vlcn.io/react";
import { IID_of } from "../id";
import { Deck } from "./schema";

const metaMutations = {
  recordNewDB(
    ctx: CtxAsync,
    dbid: Uint8Array,
    deckid: IID_of<Deck>,
    title: string
  ) {
    return ctx.db.exec(
      /*sql*/ `INSERT INTO "deck_map" ("dbid", title, last_modified, deck_id, is_dirty) VALUES (?, ?, ?, ?, ?)`,
      [dbid, title, Date.now(), deckid, false]
    );
  },
} as const;

export default metaMutations;
