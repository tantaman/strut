"use strict";

import React from "react";

import SlideEditor from "./SlideEditor";
import AppState from "../../domain/ephemeral/AppState";
import { useBind } from "../../modelHooks";
import LayoutEditor from "./layout/LayoutEditor";

export default function Editor(props: { appState: AppState }) {
  useBind(["editor_mode"], props.appState);
  const editorMode = props.appState.editor_mode;
  return (
    <div className="strt-editor">
      {editorMode === "layout" ? (
        <LayoutEditor appState={props.appState} />
      ) : (
        <SlideEditor appState={props.appState} />
      )}
    </div>
  );
}
