import { CtxAsync } from "@vlcn.io/react";
import React from "react";
import metaQueries from "../../domain/metaQueries";
import DeckCard from "./DeckCard";

const style = { display: "block" };

export default function OpenDeckDlg({
  ctx,
  onDeckChosen,
  onNewDeck,
}: {
  ctx: CtxAsync;
  onDeckChosen: (dbid: Uint8Array) => void;
  onNewDeck: () => void;
}) {
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
          <div className="modal-body">
            <DeckCard
              metaDeck={{
                title: "New Deck",
                dbid: new Uint8Array(0),
                lastModified: 0,
                isDirty: false,
              }}
              onClick={onNewDeck}
              description="Start from scratch"
            />
            {decks.map((d) => (
              <DeckCard metaDeck={d} onClick={() => onDeckChosen(d.dbid)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
