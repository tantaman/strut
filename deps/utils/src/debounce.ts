export default function debounce<T>(
  cb: (x: T) => void,
  time: number
): (x: T) => void {
  let pending: ReturnType<typeof setTimeout> | null = null;
  return (x: T) => {
    if (pending != null) {
      clearTimeout(pending);
      pending = null;
    }

    pending = setTimeout(() => {
      pending = null;
      cb(x);
    }, time);
  };
}
