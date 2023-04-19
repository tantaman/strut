import Result, { err, ok } from "./Result.js";

export default function only<T>(a: Array<T>): Result<T, Error> {
  if (a.length > 1 || a.length === 0) {
    return err(Error);
  }

  return ok(a[0]);
}
