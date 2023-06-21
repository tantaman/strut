import { CtxAsync } from "@vlcn.io/react";
import queries from "../../../domain/queries";
import { AnyComponentID, EmbedComponent } from "../../../domain/schema";
import { IID_of } from "../../../id";

// Images need to be resizable
// We can start with them as having a max-width, however.
// max-width being that of the slide. Maybe max-height being that too.
export default function EmbedViewer({
  ctx,
  id,
  selectedComponents,
}: {
  ctx: CtxAsync;
  id: IID_of<EmbedComponent>;
  selectedComponents: Set<AnyComponentID>;
}) {
  // TODO: would be nice to be able to extract the type of object...
  // maybe we can just fetch headers of the thing to figure out the type of the thing?
  // Is there a headers only request?
  // The src could be a local blob if we support dnd images.
  // these blobs would be synced over cr-sqlite if we did this...
  // write up on blob storage in cr-sqlite!
  // Till then, just img tags.
  const c = queries.embedComponent(ctx, id).data;
  if (c == null) {
    return null;
  }
  const src = c.src;
  const x = c.x || 0;
  const y = c.y || 0;

  // all the dragging stuff.
  // we should abstract out these drag concerns since TextComponent and
  // every other component uses them too.

  return null;
  // return <img src={component?.src}
}

// function EmbedViewerInner() {
//   // where component is defined
//   const [prevX, setPrevX] = useState(x);
//   const [prevY, setPrevY] = useState(y);
//   const [dragging, setDragging] = useState(false);
//   const [currPos, setCurrPos] = useState<{ x: number; y: number }>({
//     x: ((x * 100) | 0) / 100,
//     y: ((y * 100) | 0) / 100,
//   });
//   // TODO: abstract throttling of updates and ignoring while moving into a hook.
//   if (
//     (prevX != x || prevY != y) &&
//     !dragging &&
//     !ignore.current.has(x.toFixed(1) + y.toFixed(1))
//   ) {
//     setPrevX(x);
//     setPrevY(y);
//     setCurrPos({
//       x,
//       y,
//     });
//   }

//   const onDragged = useCallback(
//     (_e: DraggableEvent, data: DraggableData) => {
//       setCurrPos({
//         x: data.x,
//         y: data.y,
//       });
//       persistDrag(ctx, data.x, data.y, id, ignore.current);
//     },
//     [id]
//   );

//   const onDragStart = useCallback(() => {
//     ignore.current.clear();
//     setDragging(true);
//   }, []);
//   const onDragStop = useCallback(() => {
//     setDragging(false);
//   }, []);
//   const onKeyDown = (e: KeyboardEvent) => {
//     if (e.key === "Backspace" && !selectedComponents.has(id)) {
//       // delete the thing
//     }
//   };
// }

// TODO: EmbedViewerInner for use by preview pane.
