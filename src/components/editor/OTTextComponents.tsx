import { useEffect } from "react";
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
  const componentIds = queries.textComponentIds(appState.ctx, slideId).data;
  const selectedComponents = queries.selectedComponentIds(
    appState.ctx,
    slideId
  ).data;
  useEffect(() => {
    return () => {
      console.log("unmount ottext");
    };
  }, []);
  return (
    <div style={style} className="markdown">
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
