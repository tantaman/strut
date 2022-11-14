import { ID_of } from "@vlcn.io/id";
import React, { memo } from "react";
import AppState from "../../domain/ephemeral/AppState";
import queries from "../../domain/queries";
import { Slide } from "../../domain/schema";
import { useQuery } from "../../hooks";

export default function OTTextComponents({
  appState,
  slideId,
}: {
  appState: AppState;
  slideId: ID_of<Slide>;
}) {
  const components = useQuery(
    queries.textComponents(appState.ctx, slideId)
  ).data;
  return (
    <div>
      {components.map((c) => (
        <div key={c.id}>Text</div>
      ))}
    </div>
  );
}
