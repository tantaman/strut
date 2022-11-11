import { Changeset, commit } from "@strut/model/Changeset";
import { persistLog } from "../app_state/AppLogs";
import AppState from "../app_state/AppState";
import { decodeUrl } from "./UrlRenderer";

export default function onPopState(appState: AppState) {
  const decodedUrl = decodeUrl();
  const selectedSlide = decodedUrl?.selectedSlide;
  const editorMode = decodedUrl?.editorMode || "slide";
  const changes: (Changeset<any, any> | null)[] = [];
  if (selectedSlide) {
    changes.push(...appState.deck.selectSlideById(selectedSlide));
  }
  if (editorMode) {
    changes.push(appState.setEditorMode(editorMode));
  }
  commit(changes, [persistLog]);
}
