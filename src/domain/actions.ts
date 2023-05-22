import { IID_of } from "../id";
import { Deck } from "./schema";

const actions = {
  launchPresentation(_deckId: IID_of<Deck>) {},
};
export default actions;
