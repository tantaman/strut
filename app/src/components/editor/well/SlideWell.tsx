"use strict";

import React from "react";
import Slide from "./WellSlide";

import "styles/components/SlideWell.css";
import Css from "../../../html/Css";
import Deck from "../../deck/Deck";
import { useQuery } from "@strut/model/Hooks";
import AppState from "../../app_state/AppState";
import useMatchMedia from "~src/scripts/interactions/useMatchMedia";
import mediaCuts from "../../mobile/mediaCuts";

// const mediaQuery = window.matchMedia('(max-width: 900px)')
// Create an oritentation hook. That can use a media query.
function SlideWell({
  deck,
  className,
  appState,
}: {
  deck: Deck;
  className?: string;
  appState: AppState;
}) {
  useQuery(["slides"], deck);
  const orientHorizontally = useMatchMedia(
    "(max-width: " + mediaCuts.horizontal + "px)"
  );

  let slides = deck.slides.map((slide, index) => (
    <Slide
      deck={deck}
      slide={slide}
      index={index}
      key={slide.id}
      appState={appState}
      orient={orientHorizontally ? "horizontal" : "vertical"}
    />
  ));

  return (
    <div className={Css.joinClasses("strt-slide-well", className)}>
      {slides.toArray()}
    </div>
  );
}

export default SlideWell;
