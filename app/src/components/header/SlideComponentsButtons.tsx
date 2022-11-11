import * as React from "react";
import mutations from "../../domain/mutations";
import { AppState } from "../../domain/schema";
import * as styles from "./HeaderButton.module.css";

export default function SlideComponentsButtons({
  appState,
}: {
  appState: AppState;
}) {
  return (
    <div className={"btn-group " + styles.root} role="group">
      <button
        type="button"
        className="btn btn-outline-warning"
        onClick={() => mutations.toggleDrawing()}
      >
        <i className={"bi bi-pen-fill " + styles.icon}></i>Sketch
      </button>
    </div>
  );
}
