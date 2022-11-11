import * as React from "react";
import { createRoot } from "react-dom/client";
// @ts-ignore
import { stringify as uuidStringify } from "uuid";

import App from "./App.js";
import { Ctx } from "./hooks.js";
import sqliteWasm from "@vlcn.io/wa-crsqlite";
import tblrx from "@vlcn.io/rx-tbl";
import wdbRtc from "@vlcn.io/network-webrtc";
import { tableNames, tables } from "./domain/schema.js";

async function main() {
  const sqlite = await sqliteWasm();

  const db = await sqlite.open("strut3");
  (window as any).db = db;

  // await db.execMany(tableNames.map((n) => `DROP TABLE IF EXISTS ${n};`));

  await db.execMany(tables);
  const r = await db.execA<[Uint8Array]>("SELECT crsql_siteid()");
  const siteid = uuidStringify(r[0][0]);

  const rx = await tblrx(db);
  const rtc = await wdbRtc(db);

  window.onbeforeunload = () => {
    return db.close();
  };

  startApp({
    db,
    siteid,
    rtc,
    rx,
  });
}

function startApp(ctx: Ctx) {
  (window as any).ctx = ctx;
  const root = createRoot(document.getElementById("content")!);
  root.render(<App ctx={ctx} />);
}

main();
