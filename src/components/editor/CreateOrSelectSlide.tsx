import { otsSqaure } from "./OperatingTable";
import style from "./CreateOrSelectSlide.module.css";
import queries from "../../domain/queries";
import { IID_of } from "../../id";
import { Deck } from "../../domain/schema";
import { CtxAsync } from "@vlcn.io/react";
import mutations from "../../domain/mutations";

export default function CreateOrSelectSlide({
  ctx,
  otsStyle,
  deckId,
}: {
  ctx: CtxAsync;
  otsStyle: otsSqaure;
  deckId: IID_of<Deck>;
}) {
  const firstSlide = queries.firstSlideId(ctx, deckId).data;
  function addSlide() {
    ctx.db.tx(async (tx) => {
      const slideId = await mutations.addSlideAfter(ctx.db, tx, null, deckId);
      await mutations.selectSlide(tx, deckId, slideId);
    });
  }
  return (
    <div
      className={`strt-ot-slide ${style.root}`}
      style={{
        left: otsStyle.left,
        top: otsStyle.top,
        width: otsStyle.scaledWidth,
        height: otsStyle.scaledHeight,
        outline: "none",
      }}
    >
      {firstSlide == null ? (
        <button
          type="button"
          className={"btn btn-dark well-context-menu "}
          onClick={addSlide}
        >
          Add Slide
        </button>
      ) : (
        <div>Select a slide on the left to get started!</div>
      )}
    </div>
  );
}
