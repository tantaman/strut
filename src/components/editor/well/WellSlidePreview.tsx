import { CtxAsync, usePointQuery2, useRangeQuery2 } from "@vlcn.io/react";
import config from "../../../config";
import { queries } from "../../../domain/queries2";
import {
  EmbedComponent,
  Slide,
  TextComponent as TextComponentModel,
} from "../../../domain/schema";
import { IID_of } from "../../../id";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

const mdStyle = {
  position: "relative",
  width: config.slideWidth,
  height: config.slideHeight,
  scale: "0.1111",
  transformOrigin: "0 0",
} as const;

export default function WellSlidePreview({
  ctx,
  slideId,
}: {
  ctx: CtxAsync;
  slideId: IID_of<Slide>;
}) {
  const componentIds = useRangeQuery2(ctx, queries.componentIds, [
    slideId,
  ]).data;
  return (
    <div className="markdown" style={mdStyle}>
      {componentIds.map((c) => {
        switch (c.component_type) {
          case "TextComponent":
            return <TextComponent ctx={ctx} id={c.id} key={c.id.toString()} />;
          case "EmbedComponent" as any: // TODO: union queries!
            return <Embed ctx={ctx} id={c.id as any} key={c.id.toString()} />;
        }
      })}
    </div>
  );
}

function TextComponent({
  ctx,
  id,
}: {
  ctx: CtxAsync;
  id: IID_of<TextComponentModel>;
}) {
  const comp = usePointQuery2(ctx, id as any, queries.textComponent, [id]).data;
  if (comp == null) {
    return null;
  }

  const text = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(comp.text || "Text");

  const style = {
    top: comp.y ?? undefined,
    left: comp.x ?? undefined,
    position: "absolute",
  } as const;
  return (
    <div
      style={style}
      dangerouslySetInnerHTML={{ __html: text.value.toString() }}
    ></div>
  );
}

function Embed({ ctx, id }: { ctx: CtxAsync; id: IID_of<EmbedComponent> }) {
  const comp = usePointQuery2(ctx, id as any, queries.embedComponent, [
    id,
  ]).data;
  if (comp == null) {
    return null;
  }

  const style = {
    top: comp.y,
    left: comp.x,
    position: "absolute",
    maxWidth: 700, // TODO: move to common CSS with Op Table
  } as const;
  return <img style={style} src={comp.src} />;
}
