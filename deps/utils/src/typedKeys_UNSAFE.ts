// This is actually unsafe but usefully unsafe
// see https://stackoverflow.com/questions/55012174/why-doesnt-object-keys-return-a-keyof-type-in-typescript
export default function typedKeys<T>(o: T): (keyof T)[] {
  // @ts-ignore
  return Object.keys(o);
}
