"use strict";

import React from "react";
import Slide from "./WellSlide";

import "styles/components/SlideWell.css";
import Css from "../../../html/Css";
import { useQuery, useQueryA } from "../../../hooks";
import { AppState, Slide as SlideType } from "../../../domain/schema";
import useMatchMedia from "../../../interactions/useMatchMedia";
import mediaCuts from "../../mobile/mediaCuts";
import queries from "../../../domain/queries";
import { ID_of } from "../../../id";

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
  const slideIds = useQueryA<[ID_of<SlideType>], ID_of<SlideType>>(
    ...queries.slideIds(appState.ctx, appState.current_deck_id)
  ).data;
  const orientHorizontally = useMatchMedia(
    "(max-width: " + mediaCuts.horizontal + "px)"
  );

  return (
    <div className={Css.joinClasses("strt-slide-well", className)}>
      {slideIds.map((id, index) => (
        <Slide
          id={id}
          index={index}
          key={id}
          appState={appState}
          orient={orientHorizontally ? "horizontal" : "vertical"}
        />
      ))}
    </div>
  );
}

export default SlideWell;
