import "styles/bootstrap.css";
import "styles/bootstrap-icons/bootstrap-icons.css";
import "styles/main.css";

import * as React from "react";
import { createRoot } from "react-dom/client";

import sqliteWasm, { SQLite3 } from "@vlcn.io/wa-crsqlite";
import { Auth0Provider } from "@auth0/auth0-react";

import wasmUrl from "@vlcn.io/wa-crsqlite/wa-sqlite-async.wasm?url";
import newMetaDB, { MetaDB } from "./domain/sync/MetaDB.js";
import Bootstrap from "./Bootstrap.js";
import MetaState from "./domain/ephemeral/MetaState.js";

async function main() {
  const sqlite = await sqliteWasm((_file) => wasmUrl);
  const metaDb = await newMetaDB(sqlite);
  await startApp({
    metaDb,
    sqlite,
  });
}

async function startApp({
  metaDb,
  sqlite,
}: {
  metaDb: MetaDB;
  sqlite: SQLite3;
}) {
  const root = createRoot(document.getElementById("content")!);

  const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE;

  const metaState = new MetaState(
    {
      metaDb,
      deckDb: null,
      error: null,
      isAuthenticated: false,
      hasAuthProvider: auth0Domain != null,
      useLoggedOut: false,
      appState: null,
    },
    sqlite
  );

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
        <Bootstrap metaState={metaState} />
      </Auth0Provider>
    );
  } else {
    root.render(<Bootstrap metaState={metaState} />);
  }
}

main();
