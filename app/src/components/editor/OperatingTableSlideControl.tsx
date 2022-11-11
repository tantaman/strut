"use strict";

import React from "react";
import { commit } from "@strut/model/Changeset";
import { persistLog } from "../app_state/AppLogs";
import OperatingTableState from "../app_state/OperatingTableState";
import * as styles from "./OperatingTableSlideControl.module.css";

export default function OperatingTableSlideControl({
  otState,
}: {
  otState: OperatingTableState;
}) {
  const onExpand = () => {
    commit(otState.expandSelected(), [persistLog]);
  };
  const onClose = () => {
    commit(otState.closeSelected(), [persistLog]);
  };
  return (
    <div className={styles.root}>
      <i className="bi bi-arrows-expand" onClick={onExpand}></i>
      <i className="bi bi-x" onClick={onClose}></i>
    </div>
  );
}
