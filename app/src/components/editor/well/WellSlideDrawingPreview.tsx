import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@strut/model/Hooks";
import Deck from "../../deck/Deck";
import Drawing from "../../deck/Drawing";
import Slide from "../../deck/Slide";
import { renderToSVG } from "../../deck/renderToSVG";
import ErrorState, { StrtError } from "../../app_state/ErrorState";
import { SID_of } from "@strut/sid";

type Props = {
  className: string;
  deck: Deck;
};

function Loader({
  slide,
  deck,
  className,
  errorState,
}: Props & { slide: Slide; errorState: ErrorState }) {
  useQuery(["drawing"], slide);
  
  useEffect(() => {
    slide.genDrawing().catch((e) => {
      errorState.add({
        id: "well-slide-drawing-load-error" as SID_of<StrtError>,
        level: "ERROR",
        exception: new Error("Could not load the image for the slide"),
        time: new Date(),
      });
    })
  }, [slide]);

  if (slide.drawing == null) {
    return null;
  }

  return (
    <WellSlideDrawingPreview
      drawing={slide.drawing}
      className={className}
      deck={deck}
    />
  );
}

function WellSlideDrawingPreview({
  deck,
  drawing,
  className,
}: Props & { drawing: Drawing }) {
  const container = useRef<ParentNode>();

  const setRef = useCallback((node) => {
    container.current = node;
    if (!node) {
      return;
    }
    node.replaceChildren(renderToSVG(deck, drawing));
  }, []);

  useEffect(() => {
    return drawing.subscribeTo(["elements"], () => {
      container.current?.replaceChildren(renderToSVG(deck, drawing));
    });
  }, [drawing]);

  return <div className={className} ref={setRef}></div>;
}

const LoaderMemoized = memo(Loader);

export default LoaderMemoized;
