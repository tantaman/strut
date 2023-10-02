import metaQueries from "../../domain/metaQueries";
import DeckCard from "./DeckCard.js";
import useMetaDBID from "../metadb/useMetaDBID";
import { CtxAsync, useDB } from "@vlcn.io/react";
import { Link } from "react-router-dom";
import { bytesToHex } from "@vlcn.io/ws-common";

const style = { display: "block" };
const bodyStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "1rem",
};

export default function OpenDeckDlg({
  onNewDeck,
}: {
  onNewDeck: (ctx: CtxAsync) => void;
}) {
  const ctx = useDB(useMetaDBID()!);
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
              onClick={() => onNewDeck(ctx)}
              description="Start from scratch"
            />
            {decks.map((d) => (
              <Link
                key={d.deck_id?.toString()}
                to={`/create/${bytesToHex(d.dbid)}/${d.deck_id}`}
              >
                <DeckCard metaDeck={d} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
