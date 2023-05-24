import { hexToBytes } from "@vlcn.io/direct-connect-common";
import { CtxAsync } from "@vlcn.io/react";
import dbFactory from "../components/db/DBFactory";
import strutSchema from "../schemas/strut.mjs";
import mutations from "./mutations.js";
import { IID_of } from "../id.js";
import { Deck } from "./schema.js";
import { endpoints } from "../SyncEndpoints.js";

const metaMutations = {
  async newDeck(ctx: CtxAsync) {
    const remoteDbidHex = crypto.randomUUID().replaceAll("-", "");
    const remoteDbidBytes = hexToBytes(remoteDbidHex);
    let deckid: IID_of<Deck>;
    try {
      const deckDb = await dbFactory.get(remoteDbidHex, strutSchema, endpoints);
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
