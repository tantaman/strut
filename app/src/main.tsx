import * as React from "react";
import { createRoot } from "react-dom/client";
// @ts-ignore
import { stringify as uuidStringify } from "uuid";

import App from "./App.js";
import { Ctx } from "./hooks.js";
import sqliteWasm from "@vlcn.io/wa-crsqlite";
import tblrx from "@vlcn.io/rx-tbl";
import wdbRtc from "@vlcn.io/network-webrtc";

async function main() {
  const sqlite = await sqliteWasm();

  const db = await sqlite.open("strut3");
  (window as any).db = db;

  await db.execMany([
    `CREATE TABLE IF NOT EXISTS "deck" ("id" primary key, "title", "created", "modified");`,
    `CREATE TABLE IF NOT EXISTS "slide" ("id" primary key, "deck_id", "order", "created", "modified", "x", "y", "z");`,
    `CREATE TABLE IF NOT EXISTS "text_component" ("id" primary key, "slide_id", "text", "styles", "x", "y");`,
    `CREATE TABLE IF NOT EXISTS "embed_component" ("id" primary key, "slide_id", "src", "x", "y");`,
    `CREATE TABLE IF NOT EXISTS "shape_component" ("id" primary key, "slide_id", "type", "props", "x", "y");`,
    `CREATE TABLE IF NOT EXISTS "line_component" ("id" primary key, "slide_id", "props");`,
    `CREATE TABLE IF NOT EXISTS "line_point" ("id" primary key, "line_id", "x", "y");`,

    "SELECT crsql_as_crr('deck');",
    "SELECT crsql_as_crr('slide');",
    "SELECT crsql_as_crr('text_component');",
    "SELECT crsql_as_crr('embed_component');",
    "SELECT crsql_as_crr('shape_component');",
    "SELECT crsql_as_crr('line_component');",
    "SELECT crsql_as_crr('line_point');",
  ]);
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
  const root = createRoot(document.getElementById("container")!);
  root.render(<App ctx={ctx} />);
}

main();
