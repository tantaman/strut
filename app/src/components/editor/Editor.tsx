"use strict";

import React from "react";

import SlideEditor from "./SlideEditor";
import AppState from "../app_state/AppState";
import { useQuery } from "@strut/model/Hooks";
import LayoutEditor from "./layout/LayoutEditor";

export default function Editor(props: { appState: AppState }) {
  useQuery(["editorMode"], props.appState);
  const editorMode = props.appState.editorMode;
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
