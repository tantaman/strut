import * as styles from "./WellContextMenu.module.css";
import mutations from "../../../domain/mutations";
import AppState from "../../../domain/ephemeral/AppState";
import { IID_of } from "../../../id";
import { Slide } from "../../../domain/schema";

export default function WellContextMenu({
  appState,
  slideId,
  orient,
}: {
  appState: AppState;
  slideId: IID_of<Slide> | null;
  orient: "horizontal" | "vertical";
}) {
  return (
    <button
      type="button"
      className={
        "btn btn-dark well-context-menu " +
        (orient === "horizontal" ? styles.horizontal : styles.root)
      }
      onClick={(e) => {
        // TODO: index based or... slide id base?
        appState.ctx.db.tx(async (tx) => {
          const newSlideId = await mutations.addSlideAfter(
            appState.ctx.db,
            tx,
            slideId,
            appState.current_deck_id
          );
          await mutations.selectSlide(tx, appState.current_deck_id, newSlideId);
        });
        e.stopPropagation();
      }}
    >
      <i className="bi bi-plus"></i>
    </button>
  );
}
