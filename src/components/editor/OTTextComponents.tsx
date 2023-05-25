import AppState from "../../domain/ephemeral/AppState";
import queries from "../../domain/queries";
import { Slide } from "../../domain/schema";
import TextEditor from "./markdown/TextEditor";

import "styles/markdown/markdown-reset.css";
import { IID_of } from "../../id";
import { useRef } from "react";

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const componentIds = queries.textComponentIds(appState.ctx, slideId).data;

  const selectedComponents = queries.selectedComponentIds(
    appState.ctx,
    slideId
  ).data;

  return (
    <div style={style} className="markdown" ref={containerRef}>
      {componentIds.map((id, i) => (
        <TextEditor
          index={i}
          ctx={appState.ctx}
          key={id.toString()}
          id={id}
          scale={scale}
          selectedComponents={selectedComponents}
        />
      ))}
    </div>
  );
}
