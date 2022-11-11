// https://github.com/seancroach/ts-opaque
export type Opaque<BaseType, BrandType = unknown> = BaseType & {
  readonly [Symbols.base]: BaseType;
  readonly [Symbols.brand]: BrandType;
};

namespace Symbols {
  /**
   * `base` is a unique symbol to be used as a property key in opaque types where
   * said opaque type's underlying base type is stored.
   *
   * *Note:* At runtime, `base` does not exist. ***Do not use `base` as a runtime
   * value.***
   */
  export declare const base: unique symbol;

  /**
   * `brand` is a unique symbol to be used as a property key in opaque types
   * where said opaque type's brand is stored.
   *
   * *Note:* At runtime, `brand` does not exist. ***Do not use `brand` as a
   * runtime value.***
   */
  export declare const brand: unique symbol;
}

export type ID_of<T> = Opaque<string, T>;
