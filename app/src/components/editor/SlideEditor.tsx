"use strict";

import React, { memo } from "react";
import SlideWell from "./well/SlideWell";
import AppState from "../app_state/AppState";
import { useQuery } from "@strut/model/Hooks";
import OperatingTable from "./OperatingTable";

import SlideEditorNav from "./nav/SlideEditorNav";

function SlideEditor({ appState }: { appState: AppState }) {
  // TODO: how does the user know what queries to use?
  // They only need to query non read-only attributes of the model.
  // Maybe the model supertype can specify readonly vs non-readonly attributes!

  // and maybe we can lint.
  // If the user references a mutable property on a Model
  // then they should have `useQueried` against it!
  useQuery(["deck", "slideEditMode"], appState);
  return (
    <div>
      <SlideEditorNav appState={appState} />
      <div className="container-fluid">
        <SlideWell deck={appState.deck} appState={appState} />
        <OperatingTable appState={appState} />
      </div>
    </div>
  );
}

export default memo(SlideEditor);
