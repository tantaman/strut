import * as React from "react";
import { createRoot } from "react-dom/client";
// @ts-ignore
import { stringify as uuidStringify } from "uuid";

import App from "./App.js";
import { Ctx } from "./hooks.js";
import sqliteWasm from "@vlcn.io/wa-crsqlite";
import tblrx from "@vlcn.io/rx-tbl";
import { tables } from "./domain/schema.js";
import mutations from "./domain/mutations.js";
import AppState from "./domain/ephemeral/AppState.js";
import AuthoringState from "./domain/ephemeral/AuthoringState.js";
import EphemeralTheme from "./domain/ephemeral/EphemeralTheme.js";
import DeckIndex from "./domain/ephemeral/DeckIndex.js";
import DrawingInteractionState from "./domain/ephemeral/DrawingInteractionState.js";
import { asId } from "@vlcn.io/id";
import ErrorState from "./domain/ephemeral/ErrorState.js";
import seeds from "./domain/seed-data.js";

// @ts-ignore
import wasmUrl from "@vlcn.io/wa-crsqlite/wa-sqlite-async.wasm?url";
import startSyncWith from "@vlcn.io/sync-client";

async function main() {
  const sqlite = await sqliteWasm((file) => wasmUrl);

  const db = await sqlite.open("strut9");
  (window as any).db = db;

  // TODO: upgrade to common dev env reset fn
  // just drop all except site.
  // await db.execMany(tableNames.map((n) => `DROP TABLE IF EXISTS "${n}";`));
  // await db.execMany(
  //   crrTables.map((t) => `DROP TABLE IF EXISTS "${t}__crsql_clock";`)
  // );
  // await db.exec(`DROP TABLE IF EXISTS "__crsql_wdbreplicator_peers"`);

  await db.execMany(tables);

  const rx = tblrx(db);
  const sync = await startSyncWith({
    localDb: db,
    // the id of the database to persist into on the server.
    // if a db with that id does not exist it can be created for you
    // TODO: this shouldn't be hardcoded!
    remoteDbId: "6c4b1eee-0f77-4d5d-9f34-a37b96d2d992",
    uri: `ws://${window.location.hostname}:8080/sync`,
    // the schema to apply to the db if it does not exist
    // TODO: validate that the opened db has the desired schema and version of that schema?
    create: {
      schemaName: "strut",
    },
    rx,
  });

  await db.execMany(seeds);

  window.onbeforeunload = () => {
    return db.close();
  };

  await startApp({
    db,
    rx,
    siteid: "6c4b1eee",
  });
}

async function startApp(ctx: Ctx) {
  (window as any).ctx = ctx;
  const root = createRoot(document.getElementById("content")!);

  const appState = new AppState({
    ctx,
    editor_mode: "slide",
    modal: "none",
    current_deck_id: await mutations.genOrCreateCurrentDeck(ctx),
    authoringState: new AuthoringState({}),
    previewTheme: new EphemeralTheme({
      id: asId("ephemeral_theme"),
      bg_colorset: "default",
    }),
    drawingInteractionState: new DrawingInteractionState({
      currentTool: "arrow",
    }),
    deckIndex: new DeckIndex(),
    errorState: new ErrorState(),
  });

  root.render(<App appState={appState} />);
}

main();
