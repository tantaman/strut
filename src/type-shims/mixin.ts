export type Constructor<T> = new (...args: any[]) => T;
export type AnyConstructor = new (...input: any[]) => {};
export type AnyFunction<A = any> = (...input: any[]) => A;
export type Mixin<T extends AnyFunction> = InstanceType<ReturnType<T>>;
