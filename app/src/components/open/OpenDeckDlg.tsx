import { CtxAsync } from "@vlcn.io/react";
import React from "react";
import metaQueries from "../../domain/metaQueries";
import { Deck } from "../../domain/schema";
import { IID_of } from "../../id";
import DeckCard from "./DeckCard";

const style = { display: "block" };
const bodyStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "1rem",
};

export default function OpenDeckDlg({
  ctx,
  onDeckChosen,
  onNewDeck,
}: {
  ctx: CtxAsync;
  onDeckChosen: (dbid: Uint8Array, deckId: IID_of<Deck> | null) => void;
  onNewDeck: () => void;
}) {
  (window as any).ctx = ctx;
  const decks = metaQueries.decks(ctx).data;

  return (
    <div className="modal" tabIndex={-1} style={style}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Choose a Deck</h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body" style={bodyStyle}>
            <DeckCard
              metaDeck={{
                title: "New Deck",
                dbid: new Uint8Array(0),
                deck_id: null,
                last_modified: 0,
                is_dirty: false,
              }}
              onClick={onNewDeck}
              description="Start from scratch"
            />
            {decks.map((d) => (
              <DeckCard
                key={d.deck_id?.toString()}
                metaDeck={d}
                onClick={() => onDeckChosen(d.dbid, d.deck_id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}