export default function alias<T>(on: T, off: T): (v: boolean) => T {
  return (v) => v ? on : off;
}
