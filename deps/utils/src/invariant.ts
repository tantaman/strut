export default function invariant(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
