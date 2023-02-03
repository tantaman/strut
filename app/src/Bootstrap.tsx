import React, { useEffect, useState } from "react";
import tblrx from "@vlcn.io/rx-tbl";
import mutations from "./domain/mutations.js";
import AppState from "./domain/ephemeral/AppState.js";
import AuthoringState from "./domain/ephemeral/AuthoringState.js";
import EphemeralTheme from "./domain/ephemeral/EphemeralTheme.js";
import DeckIndex from "./domain/ephemeral/DeckIndex.js";
import DrawingInteractionState from "./domain/ephemeral/DrawingInteractionState.js";
import { asId } from "@vlcn.io/id";
import ErrorState from "./domain/ephemeral/ErrorState.js";
import { useAuth0 } from "@auth0/auth0-react";
import { MetaDB } from "./domain/sync/MetaDB.js";
import LoginDlg from "./components/LoginDlg.js";
import OpenDeckDlg from "./components/open/OpenDeckDlg.js";
import { IID_of } from "./id.js";
import { Deck } from "./domain/schema.js";
import hexToBytes from "./hexToBytes.js";
import metaMutations from "./domain/metaMutations.js";
import { newDeckDB } from "./domain/sync/DeckDB.js";
import { SQLite3 } from "@vlcn.io/wa-crsqlite";

export default function Bootstrap({
  metaDb,
  siteid,
  hasAuthProvider,
  sqlite,
}: {
  metaDb: MetaDB;
  siteid: string;
  hasAuthProvider: boolean;
  sqlite: SQLite3;
}) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [openingDeck, setOpeningDeck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [shouldLogin, setShouldLogin] = useState(
    !isAuthenticated && hasAuthProvider
  );

  // In here we'll create the app state for the chosen deck
  function onDeckChosen(dbid: Uint8Array) {}

  async function onNewDeck() {
    //
    const newdbidHex = crypto.randomUUID().replaceAll("-", "");
    const newdbidBytes = hexToBytes(newdbidHex);
    setOpeningDeck(true);

    try {
      const [_, deckDB] = await Promise.all([
        metaMutations.recordNewDB(metaDb.ctx, newdbidBytes, "Untitled"),
        newDeckDB(sqlite, newdbidBytes),
      ]);

      // now setup app state with the deckDB
    } catch (e: any) {
      setOpeningDeck(false);
      setError(e.message);
    }
  }

  useEffect(() => {
    let isMounted = true;
    initiateSync(
      isMounted,
      isAuthenticated,
      getAccessTokenSilently,
      metaDb,
      appState
    );

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // if not authenticated, log in or continue without logging in
  if (!isAuthenticated && shouldLogin) {
    // user can choose not to login and thus we set shouldLogin to false
    return <LoginDlg onNoLogin={() => setShouldLogin(false)} />;
  }

  if (appState == null) {
    // user needs to open a deck
    return (
      <OpenDeckDlg
        onDeckChosen={onDeckChosen}
        onNewDeck={onNewDeck}
        ctx={metaDb.ctx}
      />
    );
  }
  // const appState = new AppState({
  //   ctx,
  //   editor_mode: "slide",
  //   modal: "none",
  //   current_deck_id: await mutations.genOrCreateCurrentDeck(ctx),
  //   authoringState: new AuthoringState({}),
  //   previewTheme: new EphemeralTheme({
  //     id: asId("ephemeral_theme"),
  //     bg_colorset: "default",
  //   }),
  //   drawingInteractionState: new DrawingInteractionState({
  //     currentTool: "arrow",
  //   }),
  //   deckIndex: new DeckIndex(),
  //   errorState: new ErrorState(),
  //   // metaDB: newSyncState(ctx),
  // });

  // return <App appState={appState} />;
  return <div>To the app! {siteid}</div>;
}

async function initiateSync(
  isMounted: boolean,
  isAuthenticated: boolean,
  getAccessTokenSilently: ReturnType<typeof useAuth0>["getAccessTokenSilently"],
  metaDb: MetaDB,
  appState: AppState | null
) {
  if (!isMounted || !isAuthenticated) {
    return;
  }

  const accessToken = await getAccessTokenSilently({
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
    scope: "read:crsql_changes write:crsql_changes",
  });

  metaDb.connect(accessToken);

  // if appState exists, connect the currently opened deck
}
