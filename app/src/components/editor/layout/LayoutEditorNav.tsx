"use strict";

import React from "react";
import Header from "../../../widgets/Header";
import { AppState } from "../../../domain/schema";
import LogoButton from "../../header/LogoButton";
import PresentButton from "../../header/PresentButton";
import * as headerStyles from "../../header/HeaderButton.module.css";

export default function LayoutEditorNav({ appState }: { appState: AppState }) {
  return (
    <Header>
      <div>
        <LogoButton ctx={appState.ctx} deckId={appState.current_deck_id} />
      </div>
      <div></div>
      <div>
        <SlideEditorButton appState={appState} />
        <PresentButton ctx={appState.ctx} deckId={appState.current_deck_id} />
      </div>
    </Header>
  );
}

function SlideEditorButton({ appState }: { appState: AppState }) {
  const switchToSlideEditor = () => {
    appState.setEditorMode("slide");
  };
  return (
    <div className={headerStyles.root + " right-pad inline-block"}>
      <button
        className={"btn btn-outline-warning"}
        type="button"
        aria-expanded="false"
        title="Only enabled when using a custom layout (see dropdown to the right)"
        onClick={switchToSlideEditor}
      >
        <i className={"bi bi-card-list " + headerStyles.icon}></i>
        Slides
      </button>
    </div>
  );
}
