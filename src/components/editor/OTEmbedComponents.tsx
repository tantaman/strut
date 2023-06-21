import AppState from "../../domain/ephemeral/AppState";
import queries from "../../domain/queries";
import { Slide } from "../../domain/schema";
import { IID_of } from "../../id";
import EmbedViewer from "./embed/EmbedViewer";

export default function OTEmbedComponents({
  appState,
  style,
  slideId,
}: {
  appState: AppState;
  style: Object;
  slideId: IID_of<Slide>;
}) {
  const componentIds = queries.embedComponentIds(appState.ctx, slideId).data;
  const selectedComponents = queries.selectedComponentIds(
    appState.ctx,
    slideId
  ).data;

  return (
    <div style={style}>
      {componentIds.map((id) => (
        <EmbedViewer
          ctx={appState.ctx}
          key={id.toString()}
          id={id}
          selectedComponents={selectedComponents}
        />
      ))}
    </div>
  );
}
