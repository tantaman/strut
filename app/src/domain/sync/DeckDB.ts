// import seeds from "./domain/seed-data.js";

import { Model } from "@vlcn.io/model";
import { CtxAsync } from "@vlcn.io/react";
import tblrx, { TblRx } from "@vlcn.io/rx-tbl";
import { DB, SQLite3 } from "@vlcn.io/crsqlite-wasm";
import startSync from "@vlcn.io/client-websocket";
import { getConnString } from "./conectionInfo";
import hexToBytes from "../../hexToBytes";
import { IID_of } from "../../id";
import { Deck } from "../schema";
import mutations from "../mutations";
import seeds from "../seed-data";

import schema from "@strut/app-server-shared/deck?raw";

type Data = {
  connected: boolean;
  connecting: boolean;
  error?: Error;
};

// TODO: commonize with MetaDB
export class DeckDB extends Model<Data> {
  #sync?: Awaited<ReturnType<typeof startSync>>;
  public readonly rx: TblRx;
  public readonly ctx: CtxAsync;
  private closed = false;

  constructor(
    private readonly db: DB,
    public readonly remoteDbid: Uint8Array,
    public readonly mainDeckId: IID_of<Deck>
  ) {
    super({
      connected: false,
      connecting: false,
    });
    (window as any).ddb = db;
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
      this.#sync = await startSync(getConnString(), {
        localDb: this.db,
        accessToken,
        remoteDbId: this.remoteDbid,
        create: {
          schemaName: "strut",
        },
        rx: this.rx,
      });
      this.update({
        connected: true,
      });
    } finally {
      this.update({
        connecting: false,
      });
    }
  }

  close() {
    if (this.closed) {
      return;
    }
    this.update({
      connected: false,
      connecting: false,
    });
    this.rx.dispose();
    this.db.close();
    this.#sync?.stop();
    this.closed = true;
  }
}

export async function newDeckDB(
  sqlite: SQLite3,
  remoteDbid?: string,
  mainDeckId?: IID_of<Deck> | null
) {
  // we are connecting to a remote which exists.
  if (remoteDbid && mainDeckId) {
    const db = await sqlite.open(remoteDbid);
    await setupSchema(db);
    return new DeckDB(db, hexToBytes(remoteDbid), mainDeckId);
  } else {
    // we are connecting to a new remote, generated an id for it locally
    const remoteDbidHex = crypto.randomUUID().replaceAll("-", "");
    console.log(remoteDbidHex);
    const remoteDbidBytes = hexToBytes(remoteDbidHex);
    const db = await sqlite.open(remoteDbidHex);
    await setupSchema(db);
    const deckId = await mutations.genOrCreateCurrentDeck(db);

    return new DeckDB(db, remoteDbidBytes, deckId);
  }
}

async function setupSchema(db: DB) {
  await db.exec(schema);
  await db.execMany(seeds);
}
