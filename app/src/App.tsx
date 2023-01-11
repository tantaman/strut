import * as React from "react";
import { useState, useEffect } from "react";
import Editor from "./components/editor/Editor";
import hotkeys from "./components/hotkeys/hotkeys";
import OpenType from "./components/open-type/OpenType";
import LinkClickHandler from "./components/routing/LinkClickHandler";
import onPopState from "./components/routing/onPopState";
import UrlRenderer from "./components/routing/UrlRenderer";
import AppState from "./domain/ephemeral/AppState";
import ToastContainer from "./widgets/ToastContainer";

import "styles/bootstrap.css";
import "styles/bootstrap-icons/bootstrap-icons.css";
import "styles/main.css";
import "styles/markdown/markdown-reset.css";
import "styles/mobile.css";

import "styles/markdown/colors/hook.css";
import "styles/markdown/structures/structures.css";
import "styles/markdown/fonts/fonts.css";
import SyncModal from "./components/sync/SyncModal";
import { useBind } from "./interactions/useBind";
import { useAuth0 } from "@auth0/auth0-react";

export default function App({ appState }: { appState: AppState }) {
  const [linkClickHandler, _] = useState(() => new LinkClickHandler(appState));
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    hotkeys.install(appState);
    window.onpopstate = (_e) => onPopState(appState);
  }, []);

  useEffect(() => {
    let isMounted = true;
    initiateSync(isMounted, isAuthenticated, getAccessTokenSilently, appState);

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useBind(appState, ["modal"]);

  return (
    <>
      <UrlRenderer appState={appState} />
      <div onClick={linkClickHandler.handleMaybeBubbledLinkClick}>
        <Editor appState={appState} />
      </div>
      {appState.open_type ? <OpenType appState={appState} /> : null}
      {appState.configureSync ? <SyncModal appState={appState} /> : null}
      <ToastContainer errorState={appState.errorState} />
    </>
  );
}

async function initiateSync(
  isMounted: boolean,
  isAuthenticated: boolean,
  getAccessTokenSilently: ReturnType<typeof useAuth0>["getAccessTokenSilently"],
  appState: AppState
) {
  if (!isMounted || !isAuthenticated) {
    return;
  }

  const accessToken = await getAccessTokenSilently({
    audience: `https://strut.io/app/sync`,
    scope: "read:crsql_changes write:crsql_changes",
  });

  console.log(accessToken);
}
