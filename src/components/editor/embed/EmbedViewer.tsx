import { CtxAsync, useQuery2 } from "@vlcn.io/react";
import { queries } from "../../../domain/queries2";
import { AnyComponentID, EmbedComponent, Slide } from "../../../domain/schema";
import { IID_of } from "../../../id";
import { KeyboardEvent, useCallback, useRef, useState } from "react";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import mutations from "../../../domain/mutations";
import { throttle } from "throttle-debounce";
import styles from "./EmbedViewer.module.css";

// const noPointerEvents = { pointerEvents: "none" };
const persistDrag = throttle(
  100,
  (
    ctx: CtxAsync,
    x: number,
    y: number,
    componentId: IID_of<EmbedComponent>,
    ignore: Set<string>
  ) => {
    ignore.add(x.toFixed(1) + y.toFixed(1));
    return mutations.saveDrag(ctx.db, "embed_component", componentId, x, y);
  },
  {
    noLeading: true,
  }
);

// Images need to be resizable
// We can start with them as having a max-width, however.
// max-width being that of the slide. Maybe max-height being that too.
export default function EmbedViewer({
  ctx,
  id,
  slideId,
  scale,
  selectedComponents,
}: {
  ctx: CtxAsync;
  id: IID_of<EmbedComponent>;
  slideId: IID_of<Slide>;
  scale: number;
  selectedComponents: Set<AnyComponentID>;
}) {
  // TODO: would be nice to be able to extract the type of object...
  // maybe we can just fetch headers of the thing to figure out the type of the thing?
  // Is there a headers only request?
  // The src could be a local blob if we support dnd images.
  // these blobs would be synced over cr-sqlite if we did this...
  // write up on blob storage in cr-sqlite!
  // Till then, just img tags.
  const c = useQuery2(ctx, queries.embedComponent, [id]).data[0];
  if (c == null) {
    return null;
  }

  return (
    <EmbedViewerInner
      scale={scale}
      ctx={ctx}
      c={c}
      slideId={slideId}
      selectedComponents={selectedComponents}
    />
  );
  // return <img src={component?.src}
}

function EmbedViewerInner({
  ctx,
  c,
  slideId,
  scale,
  selectedComponents,
}: {
  ctx: CtxAsync;
  c: EmbedComponent;
  slideId: IID_of<Slide>;
  scale: number;
  selectedComponents: Set<AnyComponentID>;
}) {
  const ignore = useRef<Set<string>>(new Set());
  // where component is defined
  const x = c.x || 0;
  const y = c.y || 0;
  const [prevX, setPrevX] = useState(x);
  const [prevY, setPrevY] = useState(y);
  const [dragging, setDragging] = useState(false);
  const [currPos, setCurrPos] = useState<{ x: number; y: number }>({
    x: ((x * 100) | 0) / 100,
    y: ((y * 100) | 0) / 100,
  });
  // TODO: abstract throttling of updates and ignoring while moving into a hook.
  if (
    (prevX != x || prevY != y) &&
    !dragging &&
    !ignore.current.has(x.toFixed(1) + y.toFixed(1))
  ) {
    setPrevX(x);
    setPrevY(y);
    setCurrPos({
      x,
      y,
    });
  }

  const onDragged = useCallback(
    (_e: DraggableEvent, data: DraggableData) => {
      setCurrPos({
        x: data.x,
        y: data.y,
      });
      persistDrag(ctx, data.x, data.y, c.id, ignore.current);
    },
    [c.id]
  );

  const onDragStart = useCallback(() => {
    ignore.current.clear();
    setDragging(true);
  }, []);
  const onDragStop = useCallback(() => {
    setDragging(false);
  }, []);
  const onKeyDown = (e: KeyboardEvent<HTMLImageElement>) => {
    if (e.key === "Backspace") {
      // delete the thing
      return mutations.removeSelectedComponents(ctx.db, slideId);
    }
  };
  const onSelect = () => {
    return mutations.selectComponent(ctx.db, slideId, c.id, "embed");
  };

  return (
    <Draggable
      position={currPos}
      onStart={onDragStart}
      onDrag={onDragged}
      onStop={onDragStop}
      scale={scale}
    >
      <div
        className={`overlay-container inline-block ${
          selectedComponents.has(c.id) ? styles.selected : ""
        }`}
        onKeyDown={onKeyDown}
        tabIndex={1}
      >
        <img src={c.src} className={styles.img} />
        <div className="overlay" onMouseDown={onSelect}></div>
      </div>
    </Draggable>
  );
}

// TODO: EmbedViewerInner for use by preview pane.
