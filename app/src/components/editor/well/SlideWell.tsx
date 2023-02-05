"use strict";

import React from "react";
import Slide from "./WellSlide";

import "styles/components/SlideWell.css";
import Css from "../../../html/Css";
import useMatchMedia from "../../../interactions/useMatchMedia";
import mediaCuts from "../../mobile/mediaCuts";
import queries from "../../../domain/queries";
import AppState from "../../../domain/ephemeral/AppState";
import useTraceUpdate from "../../../utils/useTraceUpdate";

// const mediaQuery = window.matchMedia('(max-width: 900px)')
// Create an oritentation hook. That can use a media query.
function SlideWell({
  className,
  appState,
}: {
  className?: string;
  appState: AppState;
}) {
  useTraceUpdate("SlideWell", { className, appState });
  // TODO: paginated fetch
  const slideIds = queries.slideIds(
    appState.ctx,
    appState.current_deck_id
  ).data;
  console.log(slideIds);
  const orientHorizontally = useMatchMedia(
    "(max-width: " + mediaCuts.horizontal + "px)"
  );

  return (
    <div className={Css.joinClasses("strt-slide-well", className)}>
      {slideIds.map((id, index) => (
        <Slide
          id={id}
          index={index}
          key={id.toString()}
          appState={appState}
          orient={orientHorizontally ? "horizontal" : "vertical"}
        />
      ))}
    </div>
  );
}

export default SlideWell;
