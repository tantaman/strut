// import seeds from "./domain/seed-data.js";

import { Model } from "@vlcn.io/model";
import { CtxAsync } from "@vlcn.io/react";
import tblrx, { TblRx } from "@vlcn.io/rx-tbl";
import { DB, SQLite3 } from "@vlcn.io/wa-crsqlite";
import startSync from "@vlcn.io/client-websocket";
import { getConnString } from "./conectionInfo";
import hexToBytes from "../../hexToBytes";
import { IID_of } from "../../id";
import { Deck } from "../schema";
import mutations from "../mutations";

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

  constructor(
    private readonly db: DB,
    public readonly remoteDbid: Uint8Array,
    public readonly mainDeckId: IID_of<Deck>
  ) {
    super({
      connected: false,
      connecting: false,
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
    this.update({
      connected: false,
      connecting: false,
    });
    this.rx.dispose();
    this.db.close();
    this.#sync?.stop();
  }
}

export async function newDeckDB(
  sqlite: SQLite3,
  remoteDbid?: string,
  mainDeckId?: IID_of<Deck>
) {
  // we are connecting to a remote which exists.
  if (remoteDbid && mainDeckId) {
    return new DeckDB(
      await sqlite.open(remoteDbid),
      hexToBytes(remoteDbid),
      mainDeckId
    );
  } else {
    // we are connecting to a new remote, generated an id for it locally
    const remoteDbidHex = crypto.randomUUID().replaceAll("-", "");
    const remoteDbidBytes = hexToBytes(remoteDbidHex);
    const db = await sqlite.open(remoteDbidHex);

    const deckId = await mutations.genOrCreateCurrentDeck(db);

    return new DeckDB(db, remoteDbidBytes, deckId);
  }
}
