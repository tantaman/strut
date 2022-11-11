export default function subsetShallowEqual<P extends Partial<T>, T>(
  partial: P,
  full: T
) {
  if (Object.entries(partial).every(
    entry => full[entry[0]] === entry[1],
  )) {
    return true;
  }

  return false;
}
