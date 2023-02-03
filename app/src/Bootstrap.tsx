import React, { useEffect, useState } from "react";
import AppState from "./domain/ephemeral/AppState.js";
import AuthoringState from "./domain/ephemeral/AuthoringState.js";
import EphemeralTheme from "./domain/ephemeral/EphemeralTheme.js";
import DeckIndex from "./domain/ephemeral/DeckIndex.js";
import DrawingInteractionState from "./domain/ephemeral/DrawingInteractionState.js";
import ErrorState from "./domain/ephemeral/ErrorState.js";
import { useAuth0 } from "@auth0/auth0-react";
import { MetaDB } from "./domain/sync/MetaDB.js";
import LoginDlg from "./components/LoginDlg.js";
import OpenDeckDlg from "./components/open/OpenDeckDlg.js";
import metaMutations from "./domain/metaMutations.js";
import { DeckDB, newDeckDB } from "./domain/sync/DeckDB.js";
import { SQLite3 } from "@vlcn.io/wa-crsqlite";
import App from "./App.js";

export default function Bootstrap({
  metaDb,
  hasAuthProvider,
  sqlite,
}: {
  metaDb: MetaDB;
  hasAuthProvider: boolean;
  sqlite: SQLite3;
}) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [openingDeck, setOpeningDeck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [deckDb, setDeckDb] = useState<DeckDB | null>(null);
  const [shouldLogin, setShouldLogin] = useState(
    !isAuthenticated && hasAuthProvider
  );

  // In here we'll create the app state for the chosen deck
  function onDeckChosen(dbid: Uint8Array) {}

  async function onNewDeck() {
    setOpeningDeck(true);

    try {
      const deckDb = await newDeckDB(sqlite);
      await metaMutations.recordNewDB(
        metaDb.ctx,
        deckDb.remoteDbid,
        deckDb.mainDeckId,
        "Untitled"
      );

      await createAppStateForDeck(deckDb);
    } catch (e: any) {
      setOpeningDeck(false);
      setError(e.message);
    }
  }

  async function createAppStateForDeck(deckDb: DeckDB) {
    if (deckDb != null) {
      // TODO: appState.dispose();
      deckDb.close();
    }

    const ctx = deckDb.ctx;
    const newAppState = new AppState({
      ctx,
      editor_mode: "slide",
      modal: "none",
      current_deck_id: deckDb.mainDeckId,
      authoringState: new AuthoringState({}),
      previewTheme: new EphemeralTheme({
        id: EphemeralTheme.defaultThemeId,
        bg_colorset: "default",
      }),
      drawingInteractionState: new DrawingInteractionState({
        currentTool: "arrow",
      }),
      deckIndex: new DeckIndex(),
      errorState: new ErrorState(),
    });
    setAppState(newAppState);
    setDeckDb(deckDb);
  }

  useEffect(() => {
    let isMounted = true;
    initiateSync(
      isMounted,
      isAuthenticated,
      getAccessTokenSilently,
      metaDb,
      deckDb
    );

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, deckDb]);

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

  return <App appState={appState} />;
}

async function initiateSync(
  isMounted: boolean,
  isAuthenticated: boolean,
  getAccessTokenSilently: ReturnType<typeof useAuth0>["getAccessTokenSilently"],
  metaDb: MetaDB,
  deckDb: DeckDB | null
) {
  if (!isMounted || !isAuthenticated) {
    return;
  }

  const accessToken = await getAccessTokenSilently({
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
    scope: "read:crsql_changes write:crsql_changes",
  });

  // connect will not re-connect if already connected so this is fine.
  metaDb.connect(accessToken);
  deckDb?.connect(accessToken);
}
