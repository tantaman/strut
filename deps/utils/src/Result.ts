export function ok<T>(r: T) {
  return new Ok(r);
}

export function err<R, E extends Error>(e: { new (string): E }) {
  return new Err<R, E>(e);
}

export default abstract class Result<T, E extends Error> {
  abstract expect(msg: string): T;
  abstract unwrap(): T;
}

class Ok<T, E extends Error> extends Result<T, E> {
  constructor(private r: T) {
    super();
  }

  expect(msg: string): T {
    return this.r;
  }

  unwrap() {
    return this.r;
  }
}

class Err<R, E extends Error> extends Result<R, E> {
  constructor(private e: { new (string): E }) {
    super();
  }

  expect(msg: string): R {
    throw new this.e(msg);
  }

  unwrap(): R {
    throw new this.e("Could not unwrap. Encountered error.");
  }
}
