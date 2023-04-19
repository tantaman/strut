import nullthrows from "./nullthrows.js";

export interface MemoizedFn<T> {
  (): T;
  clear: () => void;
  set: (T) => void;
  get: () => T | undefined;
}

export default function memoize<T>(fn: () => T): MemoizedFn<T> {
  let cached: T | undefined;
  let run = false;
  const ret = () => {
    if (!run) {
      // re-entrancy would be a problem in that we'll execute more than
      // once.
      cached = fn();
      run = true;
    }

    return nullthrows(cached);
  };

  ret.clear = () => {
    run = false;
    cached = undefined;
  };

  ret.set = (x: T) => {
    run = true;
    cached = x;
  };

  ret.get = () => cached;

  return ret;
}
