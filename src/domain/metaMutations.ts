import { hexToBytes } from "@vlcn.io/ws-common";
import { CtxAsync, dbFactory } from "@vlcn.io/react";
import { StrutSchema, StrutSchemaName } from "../schemas/StrutSchema.js";
import mutations from "./mutations.js";
import { IID_of } from "../id.js";
import { Deck } from "./schema.js";

const metaMutations = {
  async newDeck(ctx: CtxAsync) {
    const remoteDbidHex = crypto.randomUUID().replaceAll("-", "");
    const remoteDbidBytes = hexToBytes(remoteDbidHex);
    let deckid: IID_of<Deck>;
    try {
      const deckDb = await dbFactory.get(remoteDbidHex, {
        name: StrutSchemaName,
        content: StrutSchema.__content,
      });
      deckid = await mutations.genOrCreateCurrentDeck(deckDb.db);

      await ctx.db.exec(
        /*sql*/ `INSERT INTO "deck_map" ("dbid", title, last_modified, deck_id, is_dirty) VALUES (?, ?, ?, ?, ?)`,
        [remoteDbidBytes, "Untitled", Date.now(), deckid, false]
      );
    } catch (e) {
      dbFactory.closeAndRemove(remoteDbidHex);
      throw e;
    }

    return [remoteDbidBytes, deckid] as const;
  },
} as const;

export default metaMutations;
