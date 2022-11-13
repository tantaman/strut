import { ID_of } from "../../id";
import { DeckIndex as IDeckIndex, Slide } from "../schema";

export default class DeckIndex implements IDeckIndex {
  getSuggestions(q: string): { id: ID_of<Slide>; title: string }[] {
    return [];
  }
}
