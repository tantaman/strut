import { IID_of } from "../../id";
import { DeckIndex as IDeckIndex, Slide } from "../schema";

export default class DeckIndex implements IDeckIndex {
  getSuggestions(_q: string): { id: IID_of<Slide>; title: string }[] {
    return [];
  }
}
