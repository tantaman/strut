import Result, { err, ok } from "./Result.js";

export default function stripSuffix(
  str: string,
  suffix: string
): Result<string, Error> {
  if (!str.endsWith(suffix)) {
    return err(Error);
  }

  return ok(str.substr(0, str.length - suffix.length));
}
