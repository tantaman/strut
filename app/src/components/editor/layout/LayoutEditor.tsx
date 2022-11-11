import React from "react";
import AppState from "../../app_state/AppState";
import LayoutEditorNav from "./LayoutEditorNav";
import * as styles from "./LayoutEditor.module.css";
import Deck from "../../deck/Deck";
import { useQuery } from "@strut/model/Hooks";
import LayoutSlide from "./LayoutSlide";

export default function LayoutEditor({ appState }: { appState: AppState }) {
  return (
    <div>
      <LayoutEditorNav appState={appState} />
      <LayoutSurface deck={appState.deck} />
    </div> 
  );
} 

function LayoutSurface({ deck }: { deck: Deck }) {
  useQuery(["slides"], deck);
  return (
    <div className={styles.container}>
      {deck.slides
        .map((slide, i) => (
          <LayoutSlide key={slide.id} deck={deck} slide={slide} i={i} />
        ))
        .toArray()}
    </div>
  );
}
