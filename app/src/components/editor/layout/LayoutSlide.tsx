import React from "react";
import { Slide } from "../../../domain/schema";
import { Deck } from "../../../domain/schema";
import { useQuery } from "../../../hooks";
import * as styles from "./LayoutSlide.module.css";
import Draggable from "../../../interactions/Draggable";
import queries from "../../../domain/queries";

export default function LayoutSlide({
  deck,
  slide,
  i,
}: {
  deck: Deck;
  slide: Slide;
  i: number;
}) {
  // queries.selectedSlides();
  useQuery(["mostRecentlySelectedSlide"], deck);
  return (
    <Draggable
      className={
        styles.slide +
        " " +
        (deck.getSelectedSlide() === slide ? styles.selected : "")
      }
      style={{ left: 250 + i * 250, top: 150 }}
      onClick={() => {
        commit(deck.selectSlideById(slide.id), [persistLog, undoLog]);
      }}
      onDragging={(pos) => {
        console.log(pos);
      }}
    >
      <div className={styles.contentContainer}>
        <div
          className={styles.content}
          style={{
            width: deck.config.slideWidth / 5,
            height: deck.config.slideHeight / 5,
          }}
        >
          <SlideDrawer />
          <div className={styles.back}></div>
          <div className={styles.top}></div>
          <div className={styles.bottom}></div>
          <div className={styles.left}></div>
          <div className={styles.right}></div>
        </div>
      </div>
      <div className={styles.formInline + " " + styles.topLabel}>
        <span
          className={styles.label + " " + styles.wResize}
          data-delta="rotateY"
        >
          ↻Y
        </span>
        <input type="text" data-option="rotateY"></input>
      </div>
      <div className={styles.formInline + " " + styles.leftLabel}>
        <span
          className={styles.label + " " + styles.sResize}
          data-delta="rotateX"
        >
          ↻X
        </span>
        <input type="text" data-option="rotateX"></input>
      </div>
      <div className={styles.formInline + " " + styles.rightLabel}>
        <span
          className={styles.label + " " + styles.nResize}
          data-delta="rotateZ"
        >
          ↻Z
        </span>
        <input type="text" data-option="rotateZ"></input>
      </div>
      <div className={styles.formInline + " " + styles.positioningCtrls}></div>
    </Draggable>
  );
}

function SlideDrawer() {
  return <div></div>;
}
