import React, { KeyboardEvent, memo, useRef } from "react";
import { Theme } from "../../domain/schema";
import { Slide } from "../../domain/schema";
import type { otsSqaure } from "./OperatingTable";
import { useBind } from "../../modelHooks";
import { IID_of } from "../../id";
import fns from "../../domain/fns";
import AppState from "../../domain/ephemeral/AppState";
import OTTextComponents from "./OTTextComponents";
// @ts-ignore
import { useSelectionContainer } from "@air/react-drag-to-select";
import mutations from "../../domain/mutations";

function OperatingTableSlide({
  slideId,
  appState,
  otsStyle,
  theme,
}: {
  slideId: IID_of<Slide>;
  appState: AppState;
  otsStyle: otsSqaure;
  theme?: Theme;
}) {
  const previewTheme = appState.previewTheme;

  useBind(previewTheme, ["bg_colorset", "fontset"]);
  useBind(appState, ["editor_mode"]);
  const container = useRef<HTMLDivElement | null>(null);
  // const allComponentPositions = queries.allComponentPositions(
  //   appState.ctx,
  //   slideId
  // );

  const { DragSelection } = useSelectionContainer({
    eventsElement: container.current,
    onSelectionChange: (_selection: any) => {
      const containerRect = container.current?.getBoundingClientRect();
      if (containerRect == null) {
        return;
      }
      // const offsetTop = containerRect.top;
      // const offsetLeft = containerRect.left;
      // console.log(selection);
      // selection is viewport positions...
      // we'll need to translate to slide positions
    },
    shouldStartSelecting: (target: Node) => {
      if (target instanceof HTMLElement) {
        return target.classList.contains("markdown");
      }
      return false;
    },
  });
  const onkeydown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key == "Delete") {
      mutations.removeSelectedComponents(appState.ctx.db, slideId);
    }
  };
  const deselectAll = (e: React.MouseEvent<HTMLElement>) => {
    if (!(e.target as HTMLElement).classList.contains("markdown")) {
      return;
    }
    mutations.deselectAllComponents(appState.ctx.db, slideId);
  };

  return (
    <>
      <div
        className={"strt-ot-slide " + fns.getFontClass(previewTheme, theme)}
        ref={(el) => {
          container.current = el;
        }}
        style={{
          left: otsStyle.left,
          top: otsStyle.top,
          width: otsStyle.scaledWidth,
          height: otsStyle.scaledHeight,
          backgroundColor: fns.getSlideColorStyle(previewTheme, theme),
          outline: "none",
        }}
        onKeyDown={onkeydown}
        onMouseDown={deselectAll}
        tabIndex={0}
      >
        <OTTextComponents
          appState={appState}
          slideId={slideId}
          scale={((otsStyle.scale * 100) | 0) / 100}
          style={{
            transform: "scale(" + otsStyle.scale + ")",
            width: otsStyle.width,
            height: otsStyle.height,
            transformOrigin: "top left",
            userSelect: "none",
          }}
        />
        <DragSelection />
      </div>
    </>
  );
}

const memoized = memo(OperatingTableSlide);

export default memoized;