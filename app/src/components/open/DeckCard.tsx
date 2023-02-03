import React from "react";
import { MetaDeck } from "../../domain/metaQueries";
const cardStyle = { width: "18rem", cursor: "pointer" };

export default function DeckCard({
  metaDeck,
  onClick,
  description,
}: {
  metaDeck: MetaDeck;
  onClick: () => void;
  description?: string;
}) {
  return (
    <div className="card" style={cardStyle} onClick={onClick}>
      <div className="card-body">
        <h5 className="card-title">{metaDeck.title}</h5>
        <p className="card-text">
          {description ? description : <MetaInfo metaDeck={metaDeck} />}
        </p>
      </div>
    </div>
  );
}

function MetaInfo({ metaDeck }: { metaDeck: MetaDeck }) {
  return (
    <>
      <div>
        Last modified: {new Date(metaDeck.last_modified).toLocaleDateString()}
      </div>
      <div>Synced? {metaDeck.is_dirty ? "No" : "Yes"}</div>
    </>
  );
}
