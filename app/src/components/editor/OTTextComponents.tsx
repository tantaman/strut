import { ID_of } from "@vlcn.io/id";
import React from "react";
import AppState from "../../domain/ephemeral/AppState";
import queries from "../../domain/queries";
import { Slide } from "../../domain/schema";
import { useQuery } from "../../hooks";
import TextEditor from "./markdown/TextEditor";

import "styles/markdown/markdown-reset.css";

export default function OTTextComponents({
  appState,
  slideId,
  style,
}: {
  appState: AppState;
  slideId: ID_of<Slide>;
  style: Object;
}) {
  const components = useQuery(
    queries.textComponents(appState.ctx, slideId)
  ).data;
  return (
    <div style={style} className="markdown">
      {components.map((c) => (
        <TextEditor key={c.id} />
      ))}
    </div>
  );
}
