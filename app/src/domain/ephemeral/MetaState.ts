import { Model } from "@vlcn.io/model";
import { DeckDB } from "../sync/DeckDB";
import { MetaDB } from "../sync/MetaDB";

type Data = {
  phase: "login" | "open" | "app";
  metaDb: MetaDB;
  deckDb: DeckDB | null;
  error: string | null;
  shouldLogin: boolean;
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
export default class MetaState extends Model<Data> {}
