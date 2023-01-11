import * as React from "react";
import { createRoot } from "react-dom/client";

import App from "./App.js";
import { Ctx } from "./hooks.js";
import sqliteWasm from "@vlcn.io/wa-crsqlite";
import tblrx from "@vlcn.io/rx-tbl";
import mutations from "./domain/mutations.js";
import AppState from "./domain/ephemeral/AppState.js";
import AuthoringState from "./domain/ephemeral/AuthoringState.js";
import EphemeralTheme from "./domain/ephemeral/EphemeralTheme.js";
import DeckIndex from "./domain/ephemeral/DeckIndex.js";
import DrawingInteractionState from "./domain/ephemeral/DrawingInteractionState.js";
import { asId } from "@vlcn.io/id";
import ErrorState from "./domain/ephemeral/ErrorState.js";
import seeds from "./domain/seed-data.js";
import { Auth0Provider } from "@auth0/auth0-react";

// @ts-ignore
import schema from "@strut/app-server-shared/schema?raw";

// @ts-ignore
import wasmUrl from "@vlcn.io/wa-crsqlite/wa-sqlite-async.wasm?url";
import startSync, { uuidStrToBytes } from "@vlcn.io/client-websocket";
import newSyncState from "./domain/sync/SyncState.js";

async function main() {
  const sqlite = await sqliteWasm((file) => wasmUrl);

  const db = await sqlite.open("strut2");
  (window as any).db = db;

  // TODO: upgrade to common dev env reset fn
  // just drop all except site.
  // await db.execMany(tableNames.map((n) => `DROP TABLE IF EXISTS "${n}";`));
  // await db.execMany(
  //   crrTables.map((t) => `DROP TABLE IF EXISTS "${t}__crsql_clock";`)
  // );

  for (const x of schema.split(";")) {
    await db.exec(x);
  }

  const rx = tblrx(db);
  // const sync = await startSync(`ws://${window.location.hostname}:8080/sync`, {
  //   localDb: db,
  //   // TODO: we need a user id...
  //   remoteDbId: uuidStrToBytes("6c4b1eee-0f77-4d5d-9f34-a37b96d2d992"),
  //   // the schema to apply to the db if it does not exist
  //   // TODO: validate that the opened db has the desired schema and version of that schema?
  //   create: {
  //     schemaName: "strut",
  //   },
  //   rx,
  // });

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
    syncState: newSyncState(ctx),
  });

  const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE;
  if (auth0Domain) {
    root.render(
      <Auth0Provider
        domain={auth0Domain}
        clientId={auth0ClientId}
        redirectUri={window.location.origin}
        cacheLocation="localstorage"
        audience={auth0Audience}
        scope="read:crsql_changes write:crsql_changes"
      >
        <App appState={appState} />
      </Auth0Provider>
    );
  } else {
    root.render(<App appState={appState} />);
  }
}

main();
