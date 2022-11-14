import React, { memo } from "react";
import { Theme } from "../../domain/schema";
import { Slide } from "../../domain/schema";
// import styles from "./OperatingTableSlide.module.css";
import type { otsSqaure } from "./OperatingTable";
import { useBind } from "../../hooks";
import { ID_of } from "../../id";
import fns from "../../domain/fns";
import AppState from "../../domain/ephemeral/AppState";

function OperatingTableSlide({
  slideId,
  appState,
  otsStyle,
  theme,
}: {
  slideId: ID_of<Slide>;
  appState: AppState;
  otsStyle: otsSqaure;
  theme?: Theme;
}) {
  const previewTheme = appState.previewTheme;

  useBind(["bg_colorset", "fontset"], previewTheme);
  useBind(["editor_mode"], appState);

  return (
    <>
      <div
        className={"strt-ot-slide " + fns.getFontClass(previewTheme, theme)}
        style={{
          left: otsStyle.left,
          top: otsStyle.top,
          width: otsStyle.scaledWidth,
          height: otsStyle.scaledHeight,
          backgroundColor: fns.getSlideColorStyle(previewTheme, theme),
        }}
      >
        {/* <div
          style={{
            transform: "scale(" + otsStyle.scale + ")",
            width: otsStyle.width,
            height: otsStyle.height,
            transformOrigin: "top left",
          }}
        >
          <MarkdownEditor slideId={slideId} appState={appState} />
        </div> */}
      </div>
    </>
  );
}

const memoized = memo(OperatingTableSlide);

export default memoized;
