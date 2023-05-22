export default function prependBounded<T>(
  arr: readonly T[],
  elem: T,
  limit: number
) {
  const copy = [...arr];
  if (copy.length >= limit) {
    copy.pop();
  }

  copy.unshift(elem);

  return copy;
}
