import * as Comlink from "comlink";
import comlinkable, {
  registerDbExtension,
  DBID,
} from "@vlcn.io/crsqlite-wasm/dist/comlinkable";
import tblrx from "@vlcn.io/rx-tbl";
import wdbRtc from "@vlcn.io/network-webrtc";
import { DB } from "@vlcn.io/crsqlite-wasm";

const rtcs = new Map<DBID, Awaited<ReturnType<typeof wdbRtc>>>();
const rxs = new Map<DBID, Awaited<ReturnType<typeof tblrx>>>();
registerDbExtension((dbid: DBID, db: DB) => {
  let rtc: Awaited<ReturnType<typeof wdbRtc>> | null = null;
  wdbRtc(db).then((_rtc) => {
    rtc = _rtc;
    rtcs.set(dbid, _rtc);
  });

  return () => {
    rtcs.delete(dbid);
    rtc!.dispose();
  };
});
registerDbExtension((dbid: DBID, db: DB) => {
  let rx: Awaited<ReturnType<typeof tblrx>> | null = null;
  tblrx(db).then((_rx) => {
    rx = _rx;
    rxs.set(dbid, _rx);
  });

  return () => {
    rxs.delete(dbid);
    rx!.dispose();
  };
});

// TODO: simpler way to compose extensions to a comlinked interface
// can we just auto-convert these APIs to comlink compatible ones?
comlinkable.onTblChange = (
  dbid: DBID,
  cb: (tbls: Set<string>) => void
): void => {
  const rx = rxs.get(dbid);
  rx!.on(cb);
};

comlinkable.offTblChange = (dbid: DBID, cb: (tbls: Set<string>) => void) => {
  const rx = rxs.get(dbid);
  rx!.off(cb);
};

comlinkable.offConnectionsChanged = (
  dbid: DBID,
  cb: (pending: string[], established: string[]) => void
) => {
  const rtc = rtcs.get(dbid);
  rtc!.offConnectionsChanged(cb);
};

// TODO: test returned functions work as expected thru a comlink
comlinkable.schemaChanged = (dbid: DBID) => {
  const rx = rxs.get(dbid);
  const rtc = rtcs.get(dbid);
  rx!.schemaChanged();
  rtc!.schemaChanged();
};

comlinkable.onConnectionsChanged = (
  dbid: DBID,
  cb: (pending: string[], established: string[]) => void
) => {
  const rtc = rtcs.get(dbid);
  rtc!.onConnectionsChanged(cb);
};

comlinkable.connectTo = (dbid: DBID, other: string) => {
  const rtc = rtcs.get(dbid);
  rtc!.connectTo(other);
};

Comlink.expose(comlinkable);
