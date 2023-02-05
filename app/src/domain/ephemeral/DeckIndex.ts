import { IID_of } from "../../id";
import { DeckIndex as IDeckIndex, Slide } from "../schema";

export default class DeckIndex implements IDeckIndex {
  getSuggestions(q: string): { id: IID_of<Slide>; title: string }[] {
    return [];
  }
}
