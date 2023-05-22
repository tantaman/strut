export default function maybeMap<T, R>(
  c: T[],
  fn: (x: T) => R | undefined | null
): R[] {
  const ret: R[] = [];
  for (let item of c) {
    let mapped = fn(item);
    if (mapped != null) {
      ret.push(mapped);
    }
  }

  return ret;
}
