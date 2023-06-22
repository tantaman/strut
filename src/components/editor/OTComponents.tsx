// Component to render all components on the OT

import AppState from "../../domain/ephemeral/AppState";
import queries from "../../domain/queries";
import { Slide } from "../../domain/schema";
import { IID_of } from "../../id";
import EmbedViewer from "./embed/EmbedViewer";
import TextEditor from "./markdown/TextEditor";

export default function OTComponents({
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
  const textIds = queries.textComponentIds(appState.ctx, slideId).data;
  const embedIds = queries.embedComponentIds(appState.ctx, slideId).data;
  const selectedComponents = queries.selectedComponentIds(
    appState.ctx,
    slideId
  ).data;

  return (
    <div style={style} className="markdown">
      {textIds.map((id, i) => (
        <TextEditor
          index={i}
          ctx={appState.ctx}
          key={id.toString()}
          id={id}
          scale={scale}
          selectedComponents={selectedComponents}
        />
      ))}
      {embedIds.map((id) => (
        <EmbedViewer
          ctx={appState.ctx}
          key={id.toString()}
          id={id}
          scale={scale}
          slideId={slideId}
          selectedComponents={selectedComponents}
        />
      ))}
    </div>
  );
}
