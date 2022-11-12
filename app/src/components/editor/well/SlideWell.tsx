"use strict";

import React from "react";
import Slide from "./WellSlide";

import "styles/components/SlideWell.css";
import Css from "../../../html/Css";
import { useQuery } from "../../../hooks";
import { AppState, Slide as SlideType } from "../../../domain/schema";
import useMatchMedia from "../../../interactions/useMatchMedia";
import mediaCuts from "../../mobile/mediaCuts";
import queries from "../../../domain/queries";

// const mediaQuery = window.matchMedia('(max-width: 900px)')
// Create an oritentation hook. That can use a media query.
function SlideWell({
  className,
  appState,
}: {
  className?: string;
  appState: AppState;
}) {
  // TODO: paginated fetch
  const slides = useQuery<SlideType>(
    ...queries.slides(appState.ctx, appState.current_deck_id)
  ).data;
  const orientHorizontally = useMatchMedia(
    "(max-width: " + mediaCuts.horizontal + "px)"
  );

  return (
    <div className={Css.joinClasses("strt-slide-well", className)}>
      {slides.map((slide, index) => (
        <Slide
          deck={deck}
          slide={slide}
          index={index}
          key={slide.id}
          appState={appState}
          orient={orientHorizontally ? "horizontal" : "vertical"}
        />
      ))}
    </div>
  );
}

export default SlideWell;
