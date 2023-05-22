import { WorkerInterface } from "@vlcn.io/direct-connect-browser";
import workerUrl from "@vlcn.io/direct-connect-browser/shared.worker.js?url";
import wasmUrl from "@vlcn.io/crsqlite-wasm/crsqlite.wasm?url";
import initWasm from "@vlcn.io/crsqlite-wasm";
import tblrx from "@vlcn.io/rx-tbl";
import { CtxAsync } from "@vlcn.io/react";

// TODO: xplat-api new pkg has these types
export type DBID = string;
export type Schema = {
  namespace: string;
  name: string;
  active: boolean;
  content: string;
};

const sqlite = await initWasm(() => wasmUrl);

const dbMap = new Map<DBID, Promise<CtxAsync>>();
const hooks = new Map<DBID, () => CtxAsync | null>();

const dbFactory = {
  async get(dbid: DBID, schema: Schema, hook?: () => CtxAsync | null) {
    if (hook) {
      hooks.set(dbid, hook);
    }
    if (dbMap.has(dbid)) {
      return await dbMap.get(dbid)!;
    }

    const entry = (async () => {
      const db = await sqlite.open(dbid);
      await db.automigrateTo(schema.name, schema.content);
      const rx = tblrx(db);
      const syncWorker = new WorkerInterface(workerUrl, wasmUrl);
      syncWorker.startSync(
        dbid as any,
        {
          createOrMigrate: new URL(
            "/sync/create-or-migrate",
            window.location.origin
          ),
          applyChanges: new URL("/sync/changes", window.location.origin),
          startOutboundStream: new URL(
            "/sync/start-outbound-stream",
            window.location.origin
          ),
        },
        rx
      );
      return {
        db,
        rx,
      };
    })();
    dbMap.set(dbid, entry);

    return await entry;
  },

  async closeAndRemove(dbid: DBID) {
    const db = await dbMap.get(dbid);
    hooks.delete(dbid);
    if (db) {
      dbMap.delete(dbid);
      db.rx.dispose();
      await db.db.close();
    }
  },

  getHook(dbid: DBID) {
    return hooks.get(dbid);
  },
} as const;

export default dbFactory;
