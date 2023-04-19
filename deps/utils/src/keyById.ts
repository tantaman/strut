export default function keyById<T extends { id: TID }, TID>(
  items: T[]
): Map<TID, T> {
  const ret = new Map();
  for (const item of items) {
    ret.set(item.id, item);
  }

  return ret;
}
