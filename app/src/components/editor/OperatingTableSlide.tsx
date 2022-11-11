import React, { memo } from "react";
import AppState from "../app_state/AppState";
import Slide from "../deck/Slide";
import Canvas from "./canvas/Canvas";
import MarkdownEditor from "./markdown/MarkdownEditor";
import * as styles from "./OperatingTableSlide.module.css";
import { commit } from "@strut/model/Changeset";
import { persistLog } from "../app_state/AppLogs";
import OperatingTableSlideControl from "./OperatingTableSlideControl";
import type { otsSqaure } from "./OperatingTable";
import { useQuery } from "@strut/model/Hooks";

function OperatingTableSlide({
  slide,
  appState,
  otsStyle,
  selected,
  only,
  index,
}: {
  slide: Slide | null | undefined;
  appState: AppState;
  otsStyle: otsSqaure | null;
  selected: boolean;
  only: boolean;
  index: string | number;
}) {
  const deck = appState.deck;
  const previewTheme = appState.previewTheme;
  const theme = deck.theme;

  useQuery(["slideColor", "font"], previewTheme);
  useQuery(["slideColor", "font"], theme);
  useQuery(["slideEditMode"], appState);

  return (
    <>
      {otsStyle != null && slide != null ? (
        <div
          className={
            "strt-ot-slide " +
            (selected && !only ? styles.selected : "") +
            previewTheme.getFontClass(theme)
          }
          style={{
            left: otsStyle.left,
            top: otsStyle.top,
            width: otsStyle.scaledWidth,
            height: otsStyle.scaledHeight,
            backgroundColor: previewTheme.getSlideColorStyle(theme),
          }}
          onClick={() => {
            if (selected || only) {
              return;
            }
            commit(deck.selectSlideById(slide.id), [persistLog]);
          }}
        >
          {/* Excalidraw has memory leaks so we can not unmount or remount it. One day we'll fix these. */}
          {index === 0 ? (
            <Canvas
              slide={slide}
              state={appState.drawingInteractionState}
              hidden={appState.slideEditMode !== "draw"}
              otsStyle={otsStyle}
              errorState={appState.errorState}
            />
          ) : null}
          <div
            style={{
              transform: "scale(" + otsStyle.scale + ")",
              width: otsStyle.width,
              height: otsStyle.height,
              transformOrigin: "top left",
            }}
          >
            <MarkdownEditor slide={slide} appState={appState} />
          </div>
          {otsStyle != null && slide != null && selected && !only ? (
            <OperatingTableSlideControl
              otState={appState.operatingTableState}
            />
          ) : null}
        </div>
      ) : null}
    </>
  );
}

const memoized = memo(OperatingTableSlide);

export default memoized;
