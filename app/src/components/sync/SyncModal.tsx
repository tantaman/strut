import * as React from "react";
import AppState from "../../domain/ephemeral/AppState";
import modalStyles from "../../widgets/Modal.module.css";
import { useAuth0 } from "@auth0/auth0-react";

export default function SyncModal({ appState }: { appState: AppState }) {
  const syncState = appState.syncState;
  const { loginWithRedirect, logout, isAuthenticated } = useAuth0();
  return (
    <div className={modalStyles.root}>
      <div className={modalStyles.title}>
        <h1>Sync</h1>
      </div>
      <div>
        {syncState.isConnected ? (
          <button>Disconnect</button>
        ) : isAuthenticated ? (
          <button>Connect</button>
        ) : null}
        {isAuthenticated ? (
          <button onClick={() => logout({ returnTo: window.location.origin })}>
            Log Out
          </button>
        ) : (
          <a href="#" onClick={() => loginWithRedirect()}>
            Log In
          </a>
        )}
      </div>
    </div>
  );
}
