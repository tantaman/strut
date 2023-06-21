"use strict";

import { DragEvent, useEffect, useRef, useState } from "react";
import Geometry from "../../math/Geometry";

import "styles/components/OperatingTable.css";
import { useBind } from "../../modelHooks";
import AppState from "../../domain/ephemeral/AppState";
import OperatingTableSlide from "./OperatingTableSlide";
import * as styles from "./OperatingTable.module.css";
import counter from "@strut/counter";
import config from "../../config";
import fns from "../../domain/fns";
import queries from "../../domain/queries";
import CreateOrSelectSlide from "./CreateOrSelectSlide";

const count = counter("OperatingTable");

export type otsSqaure = {
  scale: number;
  left: number;
  top: number;
  width: number;
  height: number;
  scaledWidth: number;
  scaledHeight: number;
};

function computeOtsSquares(
  rootEl: HTMLDivElement | null
): Array<otsSqaure> | null {
  if (!rootEl) {
    return null;
  }

  const tables = [1];
  const rows = Math.floor(Math.sqrt(tables.length));
  const cols = Math.ceil(tables.length / rows);

  var slideWidth = config.slideWidth;
  var slideHeight = config.slideHeight;

  var rootElSize = window.getComputedStyle(rootEl);

  if (!rootElSize) return null;

  // divide up width and height by rows and cols.
  var width = parseInt(rootElSize.width);
  var height = parseInt(rootElSize.height);

  var scale = Geometry.getFitSquareScaleFactor(
    slideWidth,
    slideHeight,
    width / cols,
    height / rows - 20
  );

  const leftSpacing = (width - slideWidth * cols * scale) / 2;
  const topSpacing = (height - slideHeight * rows * scale) / 2;
  return tables.map((_, i) => {
    const leftOffset = leftSpacing + slideWidth * scale * (i % cols);
    const topOffset = topSpacing + slideHeight * scale * Math.floor(i / cols);
    return {
      scale: scale,
      left: leftOffset,
      top: topOffset,
      width: slideWidth,
      height: slideHeight,
      scaledWidth: slideWidth * scale,
      scaledHeight: slideHeight * scale,
    };
  });
}

function OperatingTable({ appState }: { appState: AppState }) {
  const rootEl = useRef<HTMLDivElement>(null);
  const deckId = appState.current_deck_id;
  // TODO: are we binding current_deck_id everywhere else we use it?
  useBind(appState, ["current_deck_id", "editor_mode"]);
  const theme = queries.themeFromDeck(appState.ctx, deckId).data;
  const slideId = queries.mostRecentlySelectedSlide(appState.ctx, deckId).data;
  const [affordance, setAffordance] = useState("");
  const previewTheme = appState.previewTheme;

  useBind(previewTheme, ["bg_colorset"]);

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "link";
    }
  };
  const onDragEnter = (_e: DragEvent) => setAffordance(styles.dropAffordance);
  const onDragLeave = (_e: DragEvent) => setAffordance("");

  const [otsStyles, setOtsStyles] = useState<Array<otsSqaure> | null>(
    (): Array<otsSqaure> | null => {
      if (rootEl.current == null) {
        return null;
      }
      return computeOtsSquares(rootEl.current);
    }
  );

  const recomputeOtsSquares = () => {
    count.bump("recomputeOtsSquares");
    const style = computeOtsSquares(rootEl.current);
    setOtsStyles(style);
  };

  useEffect(() => {
    // must make the cb here so it is stable and can be removed as a listener
    const cb = () => recomputeOtsSquares();
    window.addEventListener("resize", cb);
    recomputeOtsSquares();
    return () => window.removeEventListener("resize", cb);
  }, []);

  return (
    <div
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      className={"strt-operating-table " + affordance}
      ref={rootEl}
      style={{ backgroundColor: fns.getSurfaceColorStyle(previewTheme, theme) }}
    >
      {slideId != null && otsStyles != null ? (
        <OperatingTableSlide
          appState={appState}
          slideId={slideId}
          otsStyle={otsStyles[0]}
          theme={theme}
        />
      ) : otsStyles != null ? (
        <CreateOrSelectSlide
          ctx={appState.ctx}
          otsStyle={otsStyles[0]}
          deckId={deckId}
        />
      ) : null}
      {/* <PropertyPanel
        state={appState.drawingInteractionState}
        appState={appState}
      /> */}
    </div>
  );
}

export default OperatingTable;
