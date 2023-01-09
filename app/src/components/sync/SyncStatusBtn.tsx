import * as React from "react";
import AppState from "../../domain/ephemeral/AppState";
import * as styles from "./SyncStatusBtn.module.css";

export default function SyncStatusBtn({ appState }: { appState: AppState }) {
  return (
    <span
      className={styles.root}
      onClick={() => appState.setModal("configureSync")}
    >
      {appState.syncState.isConnected ? (
        <i className="bi bi-wifi"></i>
      ) : (
        <i className="bi bi-wifi-off"></i>
      )}
    </span>
  );
}
