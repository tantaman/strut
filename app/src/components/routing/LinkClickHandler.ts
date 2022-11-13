// When a URL is clicked in the markdown (or other) docs
// we need to parse out what it wants to do.
//
// Now is its desires expressed thru href?
// or through data-id elements?
// If thru data-id, what is it trying to express?
// 1. state key to set
// 2. value to set it to
// Or something more abstract?
// yes... an event of some sorts
// 1. Event Name
// 2. Data for the event

import { MouseEvent } from "react";
import { AppState } from "../../domain/schema";
import { Slide } from "../../domain/schema";
import mutations from "../../domain/mutations";
import { ID_of } from "../../id";

// Technically this should be open for extension by bundles that want
// to handle routing events

// We have to encode stuff into the a tag in the editor given we can't re-render it or encode
// right information into the text.

// event should be client specific so the environment can interpret what to do with it as
// the response will be different based on what environment the client is in.

// if we try to make the event have one single meaning then it won't be changeable based on environment
// (presenting vs editing vs transition editing)

export type LinkClickEventType = "SLIDE_FROM_SLIDE" | "SLIDE_FROM_WELL";

export type LinkClickEvent = SlideFromSlideEvent | SlideFromWellEvent;

type SlideFromSlideEvent = {
  type: "SLIDE_FROM_SLIDE";
  id: ID_of<Slide>;
};

type SlideFromWellEvent = {
  type: "SLIDE_FROM_WELL";
  id: ID_of<Slide>;
};

const transformations = {
  SLIDE_FROM_SLIDE(state: AppState, e: SlideFromSlideEvent) {
    return mutations.selectSlide(state.ctx, state.current_deck_id, e.id);
  },
  SLIDE_FROM_WELL(state: AppState, e: SlideFromWellEvent) {
    return mutations.selectSlide(state.ctx, state.current_deck_id, e.id);
  },
};

export default class LinkClickHandler {
  constructor(private state: AppState) {}

  handleMaybeBubbledLinkClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.nodeName === "SPAN" && target.dataset.href != null) {
      try {
        const event = JSON.parse(
          decodeURIComponent(target.dataset.href.substring(1))
        );
        if (event && event.type != null) {
          this.handle(event, e);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  private handle(event: LinkClickEvent, originalEvent: MouseEvent) {
    switch (event.type) {
      case "SLIDE_FROM_SLIDE":
        transformations.SLIDE_FROM_SLIDE(this.state, event);
        break;
      case "SLIDE_FROM_WELL":
        transformations.SLIDE_FROM_WELL(this.state, event);
        break;
    }

    originalEvent.preventDefault();
    originalEvent.stopPropagation();
  }
}
