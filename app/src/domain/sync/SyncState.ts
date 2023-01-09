import { Model } from "@vlcn.io/model";
import { mnemonicToBytes } from "@tantaman/mnemonic";
import startSync from "@vlcn.io/client-websocket";
import { Ctx } from "../../hooks";
export type Data = {
  ctx: Ctx;
  realm: string | null;
};

const key = "strt-realm";

export class SyncState extends Model<Data> {
  #sync?: Awaited<ReturnType<typeof startSync>>;

  get realm() {
    return this.data.realm;
  }

  set realm(realm: string | null) {
    if (mnemonicToBytes(realm).length !== 16) {
      throw new Error("Invalid realm provided");
    }

    this.data.realm = realm;
    localStorage.setItem(key, realm || "");
  }

  async connect() {
    if (this.realm == null) {
      throw new Error("Cannot connect to sync server without a realm");
    }

    if (this.#sync) {
      this.#sync.stop();
    }

    this.#sync = await startSync(getConnString(), {
      localDb: this.data.ctx.db,
      remoteDbId: mnemonicToBytes(this.realm),
      create: {
        schemaName: "strut",
      },
      rx: this.data.ctx.rx,
    });
  }

  disconnect() {
    this.#sync?.stop();
    this.#sync = undefined;
  }

  get isConnected() {
    // TODO: dig into connection status
    return this.#sync != null;
  }
}

export default function newSyncState(ctx: Ctx) {
  const realm = localStorage.getItem(key);
  return new SyncState({ ctx, realm: realm === "" ? null : realm });
}

function getConnString() {
  if (import.meta.env.DEV) {
    return `ws://${window.location.hostname}:8080/sync`;
  } else {
    return `wss://${window.location.hostname}/sync`;
  }
}
