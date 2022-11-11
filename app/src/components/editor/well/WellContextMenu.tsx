import * as styles from "./WellContextMenu.module.css";
import React from "react";
import Deck from "../../deck/Deck";
import { commit } from "@strut/model/Changeset";
import { persistLog } from "../../app_state/AppLogs";

export default function WellContextMenu({
  deck,
  index,
  orient,
}: {
  deck: Deck;
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
        commit(deck.addSlideAfter(index), persistLog);
        e.stopPropagation();
      }}
    >
      <i className="bi bi-plus"></i>
    </button>
  );
}
