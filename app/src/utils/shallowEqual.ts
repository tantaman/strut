export default function shallowEqual<T extends Object>(l: T, r: T) {
  if (Object.keys(l).length !== Object.keys(r).length) {
    return false;
  }

  if (
    Object.entries(r).every(
      // @ts-ignore
      (entry) => l[entry[0]] === entry[1]
    )
  ) {
    return true;
  }

  return false;
}
