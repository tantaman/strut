import React, { memo } from "react";
import { Slide } from "../../../domain/schema";
import { Deck } from "../../../domain/schema";
import { CtxAsync as Ctx } from "@vlcn.io/react";
import * as styles from "./LayoutSlide.module.css";
import Draggable from "../../../interactions/Draggable";
import { IID_of } from "../../../id";
import mutations from "../../../domain/mutations";
import config from "../../../config";

const LayoutSlide = memo(function l({
  ctx,
  deckId,
  slideId,
  i,
  selected,
}: {
  ctx: Ctx;
  deckId: IID_of<Deck>;
  selected: boolean;
  slideId: IID_of<Slide>;
  i: number;
}) {
  return (
    <Draggable
      className={styles.slide + " " + (selected ? styles.selected : "")}
      style={{ left: 250 + i * 250, top: 150 }}
      onClick={() => mutations.selectSlide(ctx, deckId, slideId)}
      onDragging={(pos) => {
        console.log(pos);
      }}
    >
      <div className={styles.contentContainer}>
        <div
          className={styles.content}
          style={{
            width: config.slideWidth / 5,
            height: config.slideHeight / 5,
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
});

export default LayoutSlide;

function SlideDrawer() {
  return <div></div>;
}
