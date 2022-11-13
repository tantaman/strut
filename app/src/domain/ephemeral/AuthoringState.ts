import { Editor } from "@tiptap/core";
import { Transaction } from "prosemirror-state";
import { AuthoringState as IAuthoringState } from "../schema";
import { Model } from "@vlcn.io/model";

export default class AuthoringState
  extends Model<IAuthoringState>
  implements IAuthoringState
{
  #editor?: Editor;
  #transaction?: Transaction;

  get editor() {
    return this.#editor;
  }

  get transaction() {
    return this.#transaction;
  }

  updateEditor(editor: Editor): void {
    this.#editor = editor;
  }

  updateTransaction(transaction: Transaction): void {
    this.#transaction = transaction;
  }
}
