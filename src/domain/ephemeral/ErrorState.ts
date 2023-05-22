import { ID_of } from "../../id";
import { Model } from "@vlcn.io/model";

export type StrtError = {
  id: ID_of<StrtError>;
  level: "ERROR" | "WARNING" | "NOTICE";
  exception: Error;
  time: Date;
};

type Data = {
  errors: StrtError[];
};

export default class ErrorState extends Model<Data> {
  constructor() {
    super({
      errors: [],
    });
  }

  get errors() {
    return this.data.errors;
  }

  add(error: StrtError) {
    if (this.errors.find((e) => e.id === error.id) != null) {
      return;
    }

    this.update({
      errors: this.errors.concat(error),
    });
  }

  acknowledge(id: ID_of<StrtError>) {
    this.update({
      errors: this.errors.filter((e) => e.id !== id),
    });
  }
}
