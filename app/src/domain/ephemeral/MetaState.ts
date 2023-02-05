import { Model } from "@vlcn.io/model";
import { SQLite3 } from "@vlcn.io/wa-crsqlite";
import bytesToHex from "../../bytesToHex";
import { IID_of } from "../../id";
import metaMutations from "../metaMutations";
import { Deck } from "../schema";
import { DeckDB, newDeckDB } from "../sync/DeckDB";
import { MetaDB } from "../sync/MetaDB";
import AppState from "./AppState";
import AuthoringState from "./AuthoringState";
import DeckIndex from "./DeckIndex";
import DrawingInteractionState from "./DrawingInteractionState";
import EphemeralTheme from "./EphemeralTheme";
import ErrorState from "./ErrorState";

type Data = {
  metaDb: MetaDB;
  deckDb: DeckDB | null;
  error: string | null;
  isAuthenticated: boolean;
  hasAuthProvider: boolean;
  useLoggedOut: boolean;
  appState: AppState | null;
};

/**
 * Manages:
 * - where in the bootstrap phase we are:
 *  - login
 *  - file selection
 *  - app
 *
 * Then delegates to app state when in app.
 */
export default class MetaState extends Model<Data> {
  private startingSync: boolean = false;
  private getAccessTokenSilently: ((args: any) => Promise<string>) | null =
    null;
  constructor(data: Data, private readonly sqlite: SQLite3) {
    super(data);
  }

  get ctx() {
    return this.metaDb.ctx;
  }

  get shouldLogin() {
    if (this.data.useLoggedOut) {
      return false;
    }
    return !this.data.isAuthenticated && this.data.hasAuthProvider;
  }

  get metaDb() {
    return this.data.metaDb;
  }

  get phase(): "login" | "open" | "app" {
    if (!this.data.isAuthenticated && this.shouldLogin) {
      return "login";
    } else if (this.data.appState == null) {
      return "open";
    } else {
      return "app";
    }
  }

  proceedWithoutLogin = () => {
    this.update({
      useLoggedOut: true,
    });
  };

  onNewDeck = () => {
    if (this.data.deckDb != null) {
      // TODO: appState.dispose();
      this.data.deckDb.close();
    }

    newDeckDB(this.sqlite)
      .then((newDb) => {
        return metaMutations
          .recordNewDB(this.ctx, newDb.remoteDbid, newDb.mainDeckId, "Untitled")
          .then(() => {
            this.createAppStateForDeck(newDb);
          });
      })
      .catch((e: any) => {
        this.update({
          error: e.message,
        });
      });
  };

  onDeckChosen = (dbid: Uint8Array, mainDeckId: IID_of<Deck> | null) => {
    if (this.data.deckDb != null) {
      this.data.deckDb.close();
    }
    newDeckDB(this.sqlite, bytesToHex(dbid), mainDeckId)
      .then((newDb) => {
        this.createAppStateForDeck(newDb);
      })
      .catch((e: any) => {
        this.update({
          error: e.message,
        });
      });
  };

  updateAuthState = (
    isAuthenticated: boolean,
    getAccessTokenSilently: (args: any) => Promise<string>
  ) => {
    this.getAccessTokenSilently = getAccessTokenSilently;
    if (this.data.isAuthenticated == isAuthenticated) {
      return;
    }
    this.update({
      isAuthenticated,
    });
    if (!isAuthenticated) {
      // tear down things
      this.stopSync();
    } else {
      // set up things
      this.startSync();
    }
  };

  stopSync() {
    if (this.data.deckDb != null) {
      this.data.deckDb.close();
    }
  }

  async startSync() {
    if (!this.data.isAuthenticated) {
      return;
    }

    if (this.startingSync) {
      return;
    }
    this.startingSync = true;
    try {
      const accessToken = await (this.getAccessTokenSilently &&
        this.getAccessTokenSilently({
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: "read:crsql_changes write:crsql_changes",
        }));
      this.data.metaDb.connect(accessToken!);
      this.data.deckDb?.connect(accessToken!);
    } finally {
      this.startingSync = false;
    }
  }

  createAppStateForDeck = (deckDb: DeckDB) => {
    const ctx = deckDb.ctx;
    const newAppState = new AppState({
      ctx,
      editor_mode: "slide",
      modal: "none",
      current_deck_id: deckDb.mainDeckId,
      authoringState: new AuthoringState({}),
      previewTheme: new EphemeralTheme({
        id: EphemeralTheme.defaultThemeId,
        bg_colorset: "default",
      }),
      drawingInteractionState: new DrawingInteractionState({
        currentTool: "arrow",
      }),
      deckIndex: new DeckIndex(),
      errorState: new ErrorState(),
    });

    this.update({
      deckDb,
      appState: newAppState,
    });

    this.startSync();
  };
}

// TODO: track deps one day where each access of a data object is tracked
// so we can bind to methods that depend on data items.

/*
Knockout - 
Whenever you declare a computed observable, KO immediately invokes its evaluator function to get its initial value.
While the evaluator function is running, KO sets up a subscription to any observables (including other computed observables) that the evaluator reads. The subscription callback is set to cause the evaluator to run again, looping the whole process back to step 1 (disposing of any old subscriptions that no longer apply).
KO notifies any subscribers about the new value of your computed observable.
*/
