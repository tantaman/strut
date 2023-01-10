import * as React from "react";
import AppState from "../../domain/ephemeral/AppState";
import { SyncState } from "../../domain/sync/SyncState";
import { useBind } from "../../interactions/useBind";
import Button from "../../widgets/Button";
import modalStyles from "../../widgets/Modal.module.css";

export default function SyncModal({ appState }: { appState: AppState }) {
  const syncState = appState.syncState;
  return (
    <div className={modalStyles.root}>
      <div className={modalStyles.title}>
        <h1>Sync</h1>
      </div>
      <div>Username/Password</div>
    </div>
  );
}

function RealmInput({ syncState }: { syncState: SyncState }) {
  const [realmInvalid, setRealmInvalid] = React.useState(false);
  const [realm, setRealm] = React.useState(syncState.realm || "");
  return (
    <div>
      {realmInvalid ? "Invalid realm " : ""}
      <input
        type="text"
        value={realm}
        onChange={(e) => {
          try {
            setRealmInvalid(false);
            setRealm(e.target.value);
            syncState.realm = e.target.value;
          } catch (err) {
            setRealmInvalid(true);
          }
        }}
      />
    </div>
  );
}

function Connected({ syncState }: { syncState: SyncState }) {
  return (
    <div>
      <button onClick={() => syncState.disconnect()}>Disconnect</button>
    </div>
  );
}

function Disconnected({ syncState }: { syncState: SyncState }) {
  const [disabled, setDisabled] = React.useState(false);
  return (
    <div>
      <button
        type="button"
        className="btn btn-primary"
        disabled={disabled}
        onClick={() => {
          setDisabled(true);
          return syncState.connect().finally(() => setDisabled(false));
        }}
      >
        Connect
      </button>
    </div>
  );
}
