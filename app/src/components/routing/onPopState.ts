import { AppState } from "../../domain/schema";
import { decodeUrl } from "./UrlRenderer";

export default function onPopState(appState: AppState) {
  // const decodedUrl = decodeUrl();
  // const selectedSlide = decodedUrl?.selectedSlide;
  // const editorMode = decodedUrl?.editorMode || "slide";
  // const changes: (Changeset<any, any> | null)[] = [];
  // if (selectedSlide) {
  //   changes.push(...appState.deck.selectSlideById(selectedSlide));
  // }
  // if (editorMode) {
  //   changes.push(appState.setEditorMode(editorMode));
  // }
  // commit(changes, [persistLog]);
}
