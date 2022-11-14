import React, { useMemo } from "react";
import { Slide } from "../../../domain/schema";
import LayoutEditorNav from "./LayoutEditorNav";
import * as styles from "./LayoutEditor.module.css";
import LayoutSlide from "./LayoutSlide";
import { ID_of } from "../../../id";
import { Ctx, useQuery } from "../../../hooks";
import { Deck } from "../../../domain/schema";
import queries from "../../../domain/queries";
import AppState from "../../../domain/ephemeral/AppState";

export default function LayoutEditor({ appState }: { appState: AppState }) {
  return (
    <div>
      <LayoutEditorNav appState={appState} />
      <LayoutSurface ctx={appState.ctx} deckId={appState.current_deck_id} />
    </div>
  );
}

function LayoutSurface({ ctx, deckId }: { ctx: Ctx; deckId: ID_of<Deck> }) {
  const slides = useQuery(queries.slides(ctx, deckId)).data;
  const selectedSlideIds = useQuery(queries.selectedSlides(ctx, deckId)).data;
  const set = useMemo<Set<ID_of<Slide>>>(
    () => new Set(selectedSlideIds),
    [selectedSlideIds]
  );
  return (
    <div className={styles.container}>
      {slides.map((slide, i) => (
        <LayoutSlide
          selectedSlideIds={set}
          ctx={ctx}
          key={slide.id}
          deckId={deckId}
          slide={slide}
          i={i}
        />
      ))}
    </div>
  );
}
