"use strict";

import React, { memo } from "react";
import SlideWell from "./well/SlideWell";
import { AppState } from "../../domain/schema";
import OperatingTable from "./OperatingTable";

import SlideEditorNav from "./nav/SlideEditorNav";

function SlideEditor({ appState }: { appState: AppState }) {
  return (
    <div>
      <SlideEditorNav appState={appState} />
      <div className="container-fluid">
        <SlideWell appState={appState} />
        <OperatingTable appState={appState} />
      </div>
    </div>
  );
}

export default memo(SlideEditor);
