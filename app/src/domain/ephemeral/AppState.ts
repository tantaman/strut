import { Ctx } from "../../hooks";
import {
  AppState as IAppState,
  AuthoringState,
  Deck,
  DeckIndex,
  DrawingInteractionState,
  EphemeralTheme,
} from "../schema";
import { Model } from "@vlcn.io/model";
import { ID_of } from "../../id";

export default class AppState extends Model<IAppState> implements IAppState {
  get ctx(): Ctx {
    return this.data.ctx;
  }

  get editor_mode(): IAppState["editor_mode"] {
    return this.data.editor_mode;
  }

  get current_deck_id(): ID_of<Deck> {
    return this.data.current_deck_id;
  }

  get open_type(): boolean {
    return this.data.open_type;
  }

  get drawing(): boolean {
    return this.data.drawing;
  }

  get authoringState(): AuthoringState {
    return this.data.authoringState;
  }

  get drawingInteractionState(): DrawingInteractionState {
    return this.data.drawingInteractionState;
  }

  get previewTheme(): EphemeralTheme {
    return this.data.previewTheme;
  }

  get deckIndex(): DeckIndex {
    return this.data.deckIndex;
  }

  setEditorMode(mode: "slide" | "layout"): void {
    this.update({
      editor_mode: mode,
    });
  }

  toggleOpenType(v?: boolean | undefined): void {
    this.update({
      open_type: v,
    });
  }
}
