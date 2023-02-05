import React from "react";
import AppState from "../../domain/ephemeral/AppState";
import queries from "../../domain/queries";
import { Slide } from "../../domain/schema";
import TextEditor from "./markdown/TextEditor";

import "styles/markdown/markdown-reset.css";
import { IID_of } from "../../id";

export default function OTTextComponents({
  appState,
  slideId,
  style,
  scale,
}: {
  appState: AppState;
  slideId: IID_of<Slide>;
  style: Object;
  scale: number;
}) {
  // TODO: flip to gathering component ids instead?
  const components = queries.textComponents(appState.ctx, slideId).data;
  return (
    <div style={style} className="markdown">
      {components.map((c, i) => (
        <TextEditor
          ctx={appState.ctx}
          key={c.id.toString()}
          id={c.id}
          text={c.text || "Text"}
          scale={scale}
          x={c.x == null ? i * 10 : c.x}
          y={c.y == null ? i * 10 : c.y}
        />
      ))}
    </div>
  );
}
