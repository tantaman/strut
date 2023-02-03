import { SQLite3, DB } from "@vlcn.io/wa-crsqlite";
import { getConnString, getRestHost } from "./conectionInfo";
import startSync from "@vlcn.io/client-websocket";
import tblrx, { TblRx } from "@vlcn.io/rx-tbl";
import { Model } from "@vlcn.io/model";
import metaSchema from "@strut/app-server-shared/meta?raw";
import { CtxAsync } from "@vlcn.io/react";

type Data = {
  connected: boolean;
  connecting: boolean;
  error?: Error;
};

export class MetaDB extends Model<Data> {
  #sync?: Awaited<ReturnType<typeof startSync>>;
  public readonly rx: TblRx;
  public readonly ctx: CtxAsync;

  constructor(public readonly dbid: string, private db: DB) {
    super({
      connecting: false,
      connected: false,
    });
    this.rx = tblrx(db);
    this.ctx = {
      db,
      rx: this.rx,
    };
  }

  get connecting() {
    return this.data.connecting;
  }

  get connected() {
    return this.data.connected;
  }

  /**
   * Connect to a remote database via the user's access token.
   * This will find the meta db registered for the user,
   * get that dbid and start syncing the meta db to the remote meta db.
   *
   * TODO: retry connection if fails.
   * @param accessToken
   */
  async connect(accessToken: string) {
    if (this.connecting || this.connected) {
      return;
    }

    if (this.#sync) {
      this.#sync.stop();
    }

    this.update({
      connecting: true,
      connected: false,
    });
    try {
      const dbidResponse = await fetch(getRestHost() + "app/dbid", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const dbid = await dbidResponse.json();

      this.#sync = await startSync(getConnString(), {
        localDb: this.db,
        accessToken,
        remoteDbId: new Uint8Array(dbid.uuid.data),
        create: {
          schemaName: "strut-meta",
        },
        rx: this.rx,
      });
      this.update({
        connected: true,
      });
    } catch (e: any) {
      this.update({
        connected: false,
        error: e,
      });
    } finally {
      this.update({
        connecting: false,
      });
    }
  }

  close() {
    this.update({
      connected: false,
      connecting: false,
    });
    this.rx.dispose();
    this.db.close();
    this.#sync?.stop();
  }
}

export default function newMetaDB(sqlite: SQLite3): Promise<MetaDB> {
  return sqlite.open("meta.db").then(async (db) => {
    for (const x of metaSchema.split(";")) {
      await db.exec(x);
    }
    const dbid = await db.execA("SELECT quote(crsql_siteid())");
    return new MetaDB(dbid[0][0], db);
  });
}
