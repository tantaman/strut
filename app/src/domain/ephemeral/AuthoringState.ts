import { Model } from "@vlcn.io/model";

export default class AuthoringState extends Model<{
  // readonly editor?: Editor;
  // readonly transaction?: Transaction;
}> {
  // #editor?: Editor;
  // #transaction?: Transaction;

  get editor() {
    // return this.#editor;
    throw new Error();
  }

  get transaction() {
    throw new Error();
    // return this.#transaction;
  }

  updateEditor(editor: any): void {
    // this.#editor = editor;
  }

  updateTransaction(transaction: any): void {
    // this.#transaction = transaction;
  }
}
