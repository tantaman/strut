import * as React from "react";
import AppState from "../../domain/ephemeral/AppState";
import modalStyles from "../../widgets/Modal.module.css";

export default function SyncModal({ appState }: { appState: AppState }) {
  return (
    <div className={modalStyles.root}>
      <div className={modalStyles.title}>
        <h1>Sync</h1>
      </div>
    </div>
  );
}
