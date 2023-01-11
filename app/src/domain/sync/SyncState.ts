import { Model } from "@vlcn.io/model";
import startSync, { uuidStrToBytes } from "@vlcn.io/client-websocket";
import { Ctx } from "../../hooks";
export type Data = {
  ctx: Ctx;
};

const key = "strt-realm";

export class SyncState extends Model<Data> {
  #sync?: Awaited<ReturnType<typeof startSync>>;

  async connect(token: string) {
    if (this.#sync) {
      this.#sync.stop();
    }

    const dbidResponse = await fetch(getRestHost() + "/app/dbid", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const dbid = await dbidResponse.json();

    this.#sync = await startSync(getConnString(), {
      localDb: this.data.ctx.db,
      token,
      remoteDbId: uuidStrToBytes(dbid.uuid),
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
  return new SyncState({ ctx });
}

function getConnString() {
  if (import.meta.env.DEV) {
    return `ws://${window.location.hostname}:8080/sync`;
  } else {
    return `wss://${window.location.hostname}/sync`;
  }
}

function getRestHost() {
  if (import.meta.env.DEV) {
    return `http://${window.location.hostname}:8080/`;
  } else {
    return `https://${window.location.hostname}/`;
  }
}
