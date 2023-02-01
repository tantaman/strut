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

export default function Bootstrap({
  metaDb,
  siteid,
  hasAuthProvider,
}: {
  metaDb: MetaDB;
  siteid: string;
  hasAuthProvider: boolean;
}) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [appState, setAppState] = useState<AppState | null>(null);
  const [shouldLogin, setShouldLogin] = useState(
    !isAuthenticated && hasAuthProvider
  );

  useEffect(() => {
    let isMounted = true;
    initiateSync(isMounted, isAuthenticated, getAccessTokenSilently, metaDb);

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // if not authenticated, log in or continue without logging in
  if (!isAuthenticated && shouldLogin) {
    // user can choose not to login and thus we set shouldLogin to false
    return <div>Login?</div>;
  }

  if (appState == null) {
    // user needs to open a deck
    return <div>Open a deck</div>;
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
  metaDb: MetaDB
) {
  if (!isMounted || !isAuthenticated) {
    return;
  }

  const accessToken = await getAccessTokenSilently({
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
    scope: "read:crsql_changes write:crsql_changes",
  });

  metaDb.connect(accessToken);
}
