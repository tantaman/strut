"use strict";

import React, { useMemo, memo } from "react";
import { Presenter } from "~src/scripts/bundles/PluginInterfaces";
import Header from "~src/scripts/widgets/Header";
import AppState from "../../app_state/AppState";
import LogoButton from "../../header/LogoButton";
import PresentButton from "../../header/PresentButton";
import * as headerStyles from "../../header/HeaderButton.module.css";
import { commit } from "@strut/model/Changeset";

export default function LayoutEditorNav({ appState }: { appState: AppState }) {
  const genPresenter = useMemo(
    () => Presenter.queryFrom(appState.deck)?.gen(),
    [appState.deck.id]
  );

  return (
    <Header>
      <div>
        <LogoButton appState={appState} />
      </div>
      <div></div>
      <div>
        <SlideEditorButton appState={appState} />
        {genPresenter && (
          <PresentButton genPresenter={genPresenter} deck={appState.deck} />
        )}
      </div>
    </Header>
  );
}

function SlideEditorButton({ appState }: { appState: AppState }) {
  const switchToSlideEditor = () => {
    commit(appState.setEditorMode("slide"), []);
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
