import { CtxAsync } from "@vlcn.io/react";

const metaMutations = {
  recordNewDB(ctx: CtxAsync, dbid: Uint8Array, title: string) {
    return ctx.db.exec(
      /*sql*/ `INSERT INTO "deck_map" ("dbid", title, lastModified, isDirty) VALUES (?, ?, ?, ?)`,
      [dbid, title, Date.now(), false]
    );
  },
} as const;

export default metaMutations;
