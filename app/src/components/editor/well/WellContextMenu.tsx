import * as styles from "./WellContextMenu.module.css";
import React from "react";
import mutations from "../../../domain/mutations";
import AppState from "../../../domain/ephemeral/AppState";

export default function WellContextMenu({
  appState,
  index,
  orient,
}: {
  appState: AppState;
  index: number;
  orient: "horizontal" | "vertical";
}) {
  return (
    <button
      type="button"
      className={
        "btn btn-dark well-context-menu " +
        (orient === "horizontal" ? styles.horizontal : styles.root)
      }
      onClick={(e) => {
        // TODO: index based or... slide id base?
        mutations.addSlideAfter(appState.ctx, index, appState.current_deck_id);
        e.stopPropagation();
      }}
    >
      <i className="bi bi-plus"></i>
    </button>
  );
}
