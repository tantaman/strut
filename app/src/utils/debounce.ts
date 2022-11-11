export default function debounce(cb: () => void, time: number): () => void {
  let pending: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (pending != null) {
      clearTimeout(pending);
      pending = null;
    }

    pending = setTimeout(() => {
      pending = null;
      cb();
    }, time);
  };
}
