import { CtxAsync } from "@vlcn.io/react";
import React from "react";
import config from "../../../config";
import queries from "../../../domain/queries";
import { Slide, TextComponent } from "../../../domain/schema";
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
  const componentIds = queries.textComponentIds(ctx, slideId).data;
  return (
    <div className="markdown" style={mdStyle}>
      {componentIds.map((id) => (
        <TextComponent ctx={ctx} id={id} key={id.toString()} />
      ))}
    </div>
  );
}

function TextComponent({
  ctx,
  id,
}: {
  ctx: CtxAsync;
  id: IID_of<TextComponent>;
}) {
  const comp = queries.textComponent(ctx, id).data;
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
    top: comp.y,
    left: comp.x,
    position: "absolute",
  } as const;
  return (
    <div style={style} dangerouslySetInnerHTML={{ __html: text.value }}></div>
  );
}
