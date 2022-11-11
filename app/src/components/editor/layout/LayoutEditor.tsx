import React from "react";
import { AppState, Slide } from "../../../domain/schema";
import LayoutEditorNav from "./LayoutEditorNav";
import * as styles from "./LayoutEditor.module.css";
import LayoutSlide from "./LayoutSlide";
import { ID_of } from "../../../id";
import { Ctx, useQuery } from "../../../hooks";
import { Deck } from "../../../domain/schema";
import queries from "../../../domain/queries";

export default function LayoutEditor({ appState }: { appState: AppState }) {
  return (
    <div>
      <LayoutEditorNav appState={appState} />
      <LayoutSurface ctx={appState.ctx} deckId={appState.current_deck_id} />
    </div>
  );
}

function LayoutSurface({ ctx, deckId }: { ctx: Ctx; deckId: ID_of<Deck> }) {
  const slides = useQuery<Slide>(...queries.slides(ctx, deckId)).data;
  return (
    <div className={styles.container}>
      {slides.map((slide, i) => (
        <LayoutSlide key={slide.id} deck={deckId} slide={slide} i={i} />
      ))}
    </div>
  );
}