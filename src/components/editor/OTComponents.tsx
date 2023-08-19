// Component to render all components on the OT

import { useRangeQuery2 } from "@vlcn.io/react";
import AppState from "../../domain/ephemeral/AppState";
import { queries } from "../../domain/queries2";
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
  const componentIds = useRangeQuery2(appState.ctx, queries.componentIds, [
    slideId,
    slideId,
    slideId,
  ]).data;
  const selectedComponents = useRangeQuery2(
    appState.ctx,
    queries.selectedComponentIds,
    [slideId],
    (x) => new Set(x.map((x) => x.component_id))
  ).data;

  return (
    <div style={style} className="markdown">
      {componentIds.map(({ id, component_type }, i) => {
        switch (
          component_type as any // TODO: union types for union queries
        ) {
          case "TextComponent":
            return (
              <TextEditor
                index={i}
                ctx={appState.ctx}
                key={id.toString()}
                id={id}
                scale={scale}
                selectedComponents={selectedComponents}
              />
            );
          case "EmbedComponent":
            return (
              <EmbedViewer
                ctx={appState.ctx}
                key={id.toString()}
                id={id as any}
                scale={scale}
                slideId={slideId}
                selectedComponents={selectedComponents}
              />
            );
        }
      })}
    </div>
  );
}
