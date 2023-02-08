import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import LoginDlg from "./components/LoginDlg.js";
import OpenDeckDlg from "./components/open/OpenDeckDlg.js";
import App from "./App.js";
import MetaState from "./domain/ephemeral/MetaState.js";
import { useBind } from "./modelHooks.js";

export default function Bootstrap({ metaState }: { metaState: MetaState }) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  useBind(metaState);

  console.log(isAuthenticated);
  useEffect(() => {
    metaState.updateAuthState(isAuthenticated, getAccessTokenSilently);
  }, [isAuthenticated]);

  let content = null;
  switch (metaState.phase) {
    case "login":
      content = <LoginDlg onNoLogin={metaState.proceedWithoutLogin} />;
      break;
    case "open":
      content = (
        <OpenDeckDlg
          onDeckChosen={metaState.onDeckChosen}
          onNewDeck={metaState.onNewDeck}
          ctx={metaState.metaDb.ctx}
        />
      );
      break;
    case "app":
      content = <App appState={metaState.data.appState!} />;
      break;
  }

  return <>{content}</>;
}
