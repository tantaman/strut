export default function chain(...fns: ((x: any) => any)[]) {
  let arg = null;
  for (const fn of fns) {
    arg = fn(arg);
    if (arg === undefined) {
      return;
    }
  }

  return arg;
}
