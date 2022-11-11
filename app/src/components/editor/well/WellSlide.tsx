"use strict";

import React, { memo, Suspense, useCallback, useEffect, useRef, useState } from "react";
import css from "../../../html/Css";
import Deck from "../../deck/Deck";
import { useQuery } from "@strut/model/Hooks";
import Slide from "../../deck/Slide";
import { EphemeralTheme } from "../../deck/Theme";
import WellContextMenu from "./WellContextMenu";
import * as styles from "./WellSlide.module.css";
import { commit } from "@strut/model/Changeset";
import { persistLog, undoLog } from "../../app_state/AppLogs";
import WellSlideDrawingPreview from "./WellSlideDrawingPreview";
import AppState from "../../app_state/AppState";

const dragImageUrl = new URL(
  "../../../../images/drag-slides.svg",
  import.meta.url
);
const img = new Image();
img.src = dragImageUrl.toString();

function WellSlide(props: {
  slide: Slide;
  deck: Deck;
  index: number;
  appState: AppState;
  orient: "horizontal" | "vertical";
}) {
  useQuery(["asDom"], props.slide);
  const slide = props.slide;
  useQuery(["mostRecentlySelectedSlide"], props.deck);
  const previewTheme = props.appState.previewTheme;
  const theme = props.deck.theme;

  useQuery(["slideColor", "font"], previewTheme);
  useQuery(["slideColor", "font"], theme);

  const markdownContainer = useRef<ParentNode>();
  const [hideContextMenu, setHideContextMenu] = useState(false);
  const [dropClass, setDropClass] = useState("");

  const setRef = useCallback((node) => {
    markdownContainer.current = node;
    if (!node) {
      return;
    }
    node.replaceChildren(slide.asDom);
  }, []);

  const onDragStart = (e) => {
    setHideContextMenu(true);
    e.dataTransfer.setData("text/plain", props.index);
    e.dataTransfer.dropEffect = "move";
    e.dataTransfer.setDragImage(img, 16, 20);
  };
  const onDragEnd = () => setHideContextMenu(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let node = markdownContainer.current;
    if (!node) {
      return;
    }

    const child = slide.asDom as HTMLElement;
    node.replaceChildren(child);
  }, [slide.asDom]);

  // useEffect(() => {
  //   let node = markdownContainer.current;
  //   if (!node) {
  //     return;
  //   }

  //   const classList = node.firstElementChild?.classList;
  //   if (!classList) {
  //     return;
  //   }
  //   classList.remove(...classList);
  //   classList.add(
  //     "markdown",
  //     previewTheme.getColorClass(theme),
  //     previewTheme.getFontClass(theme)
  //   );
  // }, [previewTheme.color, theme.color, previewTheme.font, theme.font]);

  const removeSlide = (e) => {
    commit(props.deck.removeSlide(props.index) ?? [], [persistLog, undoLog]);
    e.stopPropagation();
    return false;
  };

  const onDragOver = (e) => {
    const me = containerRef?.current;
    if (me == null) {
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const myRect = me.getBoundingClientRect();
    if (props.orient === "vertical") {
      // top third - drop above
      if (e.clientY < myRect.top + myRect.height / 2) {
        setDropClass(styles.top);
        return;
      }

      // bottom third - drop below
      if (e.clientY > myRect.bottom - myRect.height / 2) {
        setDropClass(styles.bottom);
        return;
      }
    } else {
      // left third - drop left
      if (e.clientX < myRect.left + myRect.width / 2) {
        setDropClass(styles.left);
        return;
      }

      // right third - drop right
      if (e.clientX > myRect.right - myRect.width / 2) {
        setDropClass(styles.right);
        return;
      }
    }

    // middle third - drop in
    setDropClass(styles.in);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    setDropClass("");
    let toIndex = 0;
    if (dropClass === styles.top || dropClass === styles.left) {
      toIndex = props.index;
    } else if (dropClass === styles.bottom || dropClass === styles.right) {
      toIndex = props.index + 1;
    } else {
      // Drop into a slide making a sub-folder
      return;
    }
    commit(props.deck.reorder(fromIndex, toIndex), [persistLog, undoLog]);
    // reorder
    // from index, to index
  };

  const onDragLeave = () => setDropClass("");

  return (
    <div
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      ref={containerRef}
      draggable
      className={css.toClassString({
        "strt-well-slide": true,
        selected: props.deck.mostRecentlySelectedSlide === props.index,
        [styles.root]: true,
        [styles.in]: dropClass === styles.in,
        [previewTheme.getFontClass(theme)]: true,
      })}
      onClick={() => {
        commit(props.deck.setSelectedSlide(props.index, true), [
          persistLog,
          undoLog,
        ]);
      }}
      style={{ backgroundColor: previewTheme.getSlideColorStyle(theme) }}
    >
      <div className={styles.markdownContainer} ref={setRef}></div>
      <WellSlideDrawingPreview
        slide={slide}
        deck={props.deck}
        className={styles.markdownContainer}
        errorState={props.appState.errorState}
      />
      {hideContextMenu ? null : (
        <WellContextMenu
          deck={props.deck}
          index={props.index}
          orient={props.orient}
        />
      )}
      <span className={"badge bg-light text-dark " + styles.badge}>
        {props.index + 1}
      </span>
      {hideContextMenu ? null : (
        <button
          type="button"
          className={"btn-close " + styles.close}
          aria-label="Close"
          onClick={removeSlide}
        ></button>
      )}
      <div className={styles.dropOutsideIndicator + " " + dropClass}></div>
    </div>
  );
}

export default memo(WellSlide);
