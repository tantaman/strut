"use strict";

import { DragEvent, memo, MouseEvent, useRef, useState } from "react";
import css from "../../../html/Css";
import { Slide } from "../../../domain/schema";
import WellContextMenu from "./WellContextMenu";
import styles from "./WellSlide.module.css";
import AppState from "../../../domain/ephemeral/AppState";
import { IID_of } from "../../../id";
import queries from "../../../domain/queries";
import fns from "../../../domain/fns";
import mutations from "../../../domain/mutations";
import WellSlidePreview from "./WellSlidePreview";
import { useBind } from "../../../modelHooks";

const dragImageUrl = new URL(
  "../../../images/drag-slides.svg",
  import.meta.url
);
const img = new Image();
img.src = dragImageUrl.toString();

// TODO: remove use of `index`?
// it just causes needless re-render on slide addition
// and we can probs re-do remove, order, insert, to not require the
// index
function WellSlide(props: {
  id: IID_of<Slide>;
  index: number;
  appState: AppState;
  orient: "horizontal" | "vertical";
}) {
  const theme = queries.themeFromDeck(
    props.appState.ctx,
    props.appState.current_deck_id
  ).data;
  const selectedSlides = queries.selectedSlideIds(
    props.appState.ctx,
    props.appState.current_deck_id
  ).data;

  const previewTheme = props.appState.previewTheme;

  // TODO: `useBind` on `previewTheme`
  useBind(previewTheme, ["slide_color"]);
  // useQuery(["slideColor", "font"], previewTheme);

  const [hideContextMenu, setHideContextMenu] = useState(false);
  const [dropClass, setDropClass] = useState("");

  const onDragStart = (e: DragEvent) => {
    setHideContextMenu(true);
    e.dataTransfer.setData("text/plain", props.id.toString());
    e.dataTransfer.dropEffect = "move";
    e.dataTransfer.setDragImage(img, 16, 20);
  };
  const onDragEnd = () => setHideContextMenu(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const removeSlide = (e: MouseEvent) => {
    mutations.removeSlide(
      props.appState.ctx.db,
      props.id,
      props.appState.current_deck_id,
      selectedSlides.has(props.id)
    );
    e.stopPropagation();
    return false;
  };

  const onDragOver = (e: DragEvent) => {
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

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const fromId = BigInt(
      e.dataTransfer.getData("text/plain")
    ) as IID_of<Slide>;
    setDropClass("");
    let toId = null;
    let side: "after" | "before" = "after";
    if (dropClass === styles.top || dropClass === styles.left) {
      toId = props.id;
      side = "before";
    } else if (dropClass === styles.bottom || dropClass === styles.right) {
      toId = props.id;
    } else {
      // Drop into a slide making a sub-folder
      return;
    }
    mutations.reorderSlides(
      props.appState.ctx.db,
      props.appState.current_deck_id,
      fromId,
      toId,
      side
    );
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
        selected:
          selectedSlides.size == 0
            ? props.index == 0
            : selectedSlides.has(props.id),
        [styles.root]: true,
        [styles.in]: dropClass === styles.in,
        [fns.getFontClass(previewTheme, theme) || ""]: true,
      })}
      onClick={() => {
        mutations.selectSlide(
          props.appState.ctx.db,
          props.appState.current_deck_id,
          props.id
        );
      }}
      style={{ backgroundColor: fns.getSlideColorStyle(previewTheme, theme) }}
    >
      {hideContextMenu ? null : (
        <WellContextMenu
          appState={props.appState}
          slideId={props.id}
          orient={props.orient}
        />
      )}
      <span className={"badge bg-light text-dark " + styles.badge}>
        {props.index + 1}
      </span>
      <div className={styles.dropOutsideIndicator + " " + dropClass}></div>
      <WellSlidePreview ctx={props.appState.ctx} slideId={props.id} />
      {hideContextMenu ? null : (
        <button
          type="button"
          className={"btn-close " + styles.close}
          aria-label="Close"
          onClick={removeSlide}
        ></button>
      )}
    </div>
  );
}

export default memo(WellSlide);
