export default function select<T>(
  keys: string[],
  object: { [key: string]: T }
) {
  return keys.map((k) => object[k]);
}
