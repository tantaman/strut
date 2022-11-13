import { Editor } from "@tiptap/core";
import { Transaction } from "prosemirror-state";
import { Model } from "@vlcn.io/model";

export default class AuthoringState extends Model<{
  readonly editor?: Editor;
  readonly transaction?: Transaction;
}> {
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
