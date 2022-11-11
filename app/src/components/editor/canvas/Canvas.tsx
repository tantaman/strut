import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import DrawingInteractionState from "../../app_state/DrawingInteractionState";
import Slide from "../../deck/Slide";
import { ExcalidrawImperativeAPI } from "../../../../../git_modules/excalidraw/src/types";
import Excalidraw from "../../../../../git_modules/excalidraw/src/packages/excalidraw/index";
import { otsSqaure } from "../OperatingTable";
import counter from "@strut/counter";
import Drawing from "../../deck/Drawing";
import { commit } from "@strut/model/Changeset";
import { persistLog } from "../../app_state/AppLogs";
import { useDebounce } from "../../../widgets/Hooks";
import ErrorState, { StrtError } from "../../app_state/ErrorState";
import { SID_of } from "@strut/sid";
import { useQuery } from "@strut/model/Hooks";

type Props = {
  state: DrawingInteractionState;
  hidden: boolean;
  otsStyle: otsSqaure;
};
const count = counter("Canvas");

export default function Loader({
  state,
  slide,
  hidden,
  otsStyle,
  errorState,
}: Props & { slide: Slide; errorState: ErrorState }) {
  useQuery(["drawing"], slide);

  useEffect(() => {
    slide.genDrawing().then((drawing) => {
      if (drawing) {
        return;
      }

      const cs = slide.createDrawing();
      if (cs instanceof Drawing) {
        return cs;
      }
      commit(cs, persistLog);
    }).catch((e) => {
      errorState.add({
        id: "canvas-drawing-load-error" as SID_of<StrtError>,
        level: "ERROR",
        exception: new Error("Could not load or create the image for the slide"),
        time: new Date(),
      });
    });
  }, [slide]);

  if (slide.drawing == null) {
    return <div>Loading...</div>;
  }

  return (
    <Canvas
      state={state}
      drawing={slide.drawing}
      hidden={hidden}
      otsStyle={otsStyle}
    />
  );
}

function Canvas({
  state,
  hidden,
  otsStyle,
  drawing,
}: Props & { drawing: Drawing }) {
  const [excalidrawRef, setExcalidrawRef] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const refCb = useCallback((ref) => setExcalidrawRef(ref), []);

  const persist = useCallback(
    useDebounce(() => {
      // TODO: we need a `commitDebounced`
      // so this doesn't get interleaved in with an undo
      // We could persist to undo log and this might work fine
      const elems = excalidrawRef?.getSceneElements();
      if (elems == null) {
        return;
      }
      // We have to copy because Excalidraw mutates elems in the array directly :/
      commit(drawing.setElements([...elems]), [persistLog /*undoLog*/]);
    }, 500),
    [excalidrawRef, drawing]
  );

  useEffect(() => {
    count.bump("mount");
    return () => {
      count.bump("unmount");
    };
  }, []);
  useEffect(() => {
    count.bump("ots_style_effect");
    excalidrawRef?.updateDOMRect();
    excalidrawRef?.setAppState({
      zoom: {
        value: otsStyle.scale,
        translation: {
          x: 0,
          y: 0,
        },
      },
    });
  }, [otsStyle.top, otsStyle.left, otsStyle.scale, excalidrawRef]);
  // If we receive an entirely new drawing
  // update excalidraw with that fact
  useEffect(() => {
    excalidrawRef?.resetScene({
      newElements: drawing.elements,
      resetLoadingState: true,
      stateToKeep: {
        zoom: {
          value: otsStyle.scale as any,
          translation: {
            x: 0,
            y: 0,
          },
        },
        viewBackgroundColor: "#FFFFFF00",
      },
    });
  }, [drawing]);

  // We do not useQuery this as it needs to invoke an imperative API on exclidraw.
  // To invoke an API method on every render would be madness.
  useEffect(() => {
    count.bump("subscribe_to_state");
    return state.subscribeTo(["currentTool"], () => {
      if (state.source === "excali") {
        // Don't update excalidraw if excalidraw forced the event
        // This is horrible I know and completely breaks the assumption
        // that mutations are side-effect free and can be merged.
        return;
      }
      excalidrawRef?.switchShape(state.currentTool, "mouse");
    });
  }, [state, excalidrawRef]);

  const onExcaliChange = useCallback(
    (elements, excaliState) => {
      state.excaliStateChanged(
        elements,
        excaliState,
        excalidrawRef?.actionManager
      );
      persist();
    },
    [state, persist]
  );

  const initialData = useMemo(() => {
    return {
      elements: drawing.elements,
      appState: { viewBackgroundColor: "#FFFFFF00", currentItemFontFamily: 1 },
    };
  }, [drawing]);

  return (
    <div
      style={{
        zIndex: hidden ? 0 : 1,
        width: otsStyle.scaledWidth,
        height: otsStyle.scaledHeight,
        position: "absolute",
        overflow: "hidden",
      }}
    >
      <Excalidraw
        ref={refCb}
        initialData={initialData}
        onChange={onExcaliChange}
        viewModeEnabled={false}
        zenModeEnabled={true}
        gridModeEnabled={false}
      />
    </div>
  );
}
