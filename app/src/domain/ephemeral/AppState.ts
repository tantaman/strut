import { Ctx } from "../../hooks";
import { Deck, DeckIndex } from "../schema";
import { Model } from "@vlcn.io/model";
import { ID_of } from "../../id";
import ErrorState from "./ErrorState";
import AuthoringState from "./AuthoringState";
import EphemeralTheme from "./EphemeralTheme";
import DrawingInteractionState from "./DrawingInteractionState";

export type Data = {
  readonly ctx: Ctx;
  readonly editor_mode: "slide" | "layout";
  readonly current_deck_id: ID_of<Deck>;
  readonly modal: "openType" | "configureSync" | "deckSelection" | "none";
  readonly authoringState: AuthoringState;
  readonly drawingInteractionState: DrawingInteractionState;
  readonly previewTheme: EphemeralTheme;
  readonly deckIndex: DeckIndex;
  readonly errorState: ErrorState;
};

export default class AppState extends Model<Data> {
  static colorThemes = [
    {
      name: "color-default",
      label: "Default",
    },
    {
      name: "color-orange_drip",
      label: "Oranges",
    },
    // {
    //   name: 'ripped',
    //   label: 'Rip',
    // },
    {
      name: "color-masculinity",
      label: "Dark and Handsome",
    },
    // {
    //   name: 'dusted',
    //   label: 'Dusty',
    // },
    {
      name: "color-comfort",
      label: "Comfort",
    },
    {
      name: "color-beach",
      label: "Beach House",
    },
    {
      name: "color-nsunset",
      label: "Vice",
    },
    {
      name: "color-greys",
      label: "Greys",
    },
  ];
  static structureThemes = [
    {
      name: "default",
      label: "Default",
    },
    {
      name: "structure-center",
      label: "Center",
    },
    {
      name: "structure-right",
      label: "Right",
    },
  ];
  static fontThemes = [
    {
      name: "font-default",
      label: "Default",
    },
    {
      name: "font-virgil",
      label: "Virgil",
    },
    {
      name: "font-roboto",
      label: "Roboto",
    },
    {
      name: "font-fira",
      label: "Fira",
    },
    {
      name: "font-montserrat",
      label: "Montserrat",
    },
    {
      name: "font-open-sans",
      label: "Open Sans",
    },
    {
      name: "font-dosis",
      label: "Dosis",
    },
    {
      name: "font-koho",
      label: "KoHo",
    },
  ];

  get ctx(): Ctx {
    return this.data.ctx;
  }

  get editor_mode(): Data["editor_mode"] {
    return this.data.editor_mode;
  }

  get current_deck_id(): ID_of<Deck> {
    return this.data.current_deck_id;
  }

  get open_type(): boolean {
    return this.data.modal === "openType";
  }

  get configureSync(): boolean {
    return this.data.modal === "configureSync";
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

  get errorState(): ErrorState {
    return this.data.errorState;
  }

  setEditorMode(mode: "slide" | "layout"): void {
    this.update({
      editor_mode: mode,
    });
  }

  setModal(modal: Data["modal"]) {
    this.update({
      modal,
    });
  }

  toggleOpenType(v?: boolean | undefined): void {
    let open = false;
    if (v) open = true;
    else if (v === false) open = false;
    else if (this.data.modal === "openType") open = false;
    else open = true;

    if (open) {
      this.update({
        modal: "openType",
      });
    } else {
      this.update({
        modal: "none",
      });
    }
  }
}
