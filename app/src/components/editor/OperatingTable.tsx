"use strict";

import React, { useEffect, useRef, useState } from "react";
import Geometry from "../../math/Geometry";
import _ from "lodash";

import "styles/components/OperatingTable.css";
import { useQuery } from "@strut/model/Hooks";
import AppState from "../app_state/AppState";
import OperatingTableSlide from "./OperatingTableSlide";
import * as styles from "./OperatingTable.module.css";
import counter from "@strut/counter";
import { commit } from "@strut/model/Changeset";
import { persistLog } from "../app_state/AppLogs";
import PropertyPanel from "./props-panel/PropertyPanel";

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

function computeOtsSquares(deck, tables, rootEl): Array<otsSqaure> | null {
  const rows = Math.floor(Math.sqrt(tables.size));
  const cols = Math.ceil(tables.size / rows);

  var slideWidth = deck.config.slideWidth;
  var slideHeight = deck.config.slideHeight;

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
  return tables
    .map((_, i) => {
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
    })
    .toArray();
}

function OperatingTable({ appState }: { appState: AppState }) {
  const rootEl = useRef(null);
  const deck = appState.deck;
  const operatingTableState = appState.operatingTableState;
  useQuery(["slideEditMode", "deck", "operatingTableState"], appState);
  useQuery(["selectedSlide", "slides"], operatingTableState);
  const [affordance, setAffordance] = useState("");
  const previewTheme = appState.previewTheme;
  const theme = appState.deck.theme;

  useQuery(["surfaceColor"], previewTheme);
  useQuery(["surfaceColor"], theme);

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "link";
  };
  const onDrop = (e) => {
    e.preventDefault();
    const index = parseInt(e.dataTransfer.getData("text/plain"), 10);
    setAffordance("");

    const slide = deck.getSlides().get(index);
    if (slide == null) {
      return;
    }
    commit(operatingTableState.addSlide(slide), [persistLog]);
  };
  const onDragEnter = (e) => setAffordance(styles.dropAffordance);
  const onDragLeave = (e) => setAffordance("");

  const [otsStyles, setOtsStyles] = useState<Array<otsSqaure> | null>(
    (): Array<otsSqaure> | null => {
      if (rootEl.current == null) {
        return null;
      }
      return computeOtsSquares(
        deck,
        operatingTableState.slides,
        rootEl.current
      );
    }
  );

  const recomputeOtsSquares = () => {
    count.bump("recomputeOtsSquares");
    const style = computeOtsSquares(
      deck,
      operatingTableState.slides,
      rootEl.current
    );
    setOtsStyles(style);
  };

  // do you need to do a useEffect based on `appState.tables`?
  // when tables changes we'll re-render the component
  // but we don't compute the square on every render
  // we could change to computing the square on every render instead...
  // or use an effect on tables
  useEffect(() => {
    count.bump("useEffect[appState.slides.size]");
    recomputeOtsSquares();
  }, [operatingTableState.slides.size]);

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
      onDrop={onDrop}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      className={"strt-operating-table " + affordance}
      ref={rootEl}
      style={{ backgroundColor: previewTheme.getSurfaceColorStyle(theme) }}
    >
      {operatingTableState.slides
        .map((s, i) => (
          <OperatingTableSlide
            selected={operatingTableState.selectedSlide === s}
            only={operatingTableState.slides.size <= 1}
            appState={appState}
            slide={s}
            otsStyle={otsStyles != null ? otsStyles[i] : null}
            index={i}
            key={
              i /* IMPORTANT! Key should be i! OperatingTableSlide handles reconiliation correctly internally.
            Setting this so s.id will cause the component to remount and recreate Excalidraw and ProseMirror.
          Very bad. We do not trust those components to not leak memory so we must never unmount and remount them.*/
            }
          />
        ))
        .toArray()}
      <PropertyPanel
        state={appState.drawingInteractionState}
        appState={appState}
      />
    </div>
  );
}

export default OperatingTable;
