import invariant from "./invariant.js";
import * as math from "./math.js";
import notEmpty from "./notEmpty.js";
import nullthrows from "./nullthrows.js";
import typedKeys from "./typedKeys_UNSAFE.js";
import memoize from "./memoize.js";
import asString from "./asString.js";
import debounce from "./debounce.js";
import keyById from "./keyById.js";
import readAndParse from "./readAndParse.js";
import stripSuffix from "./stripSuffix.js";
import select from "./select.js";
import upcaseAt from "./upcaseAt.js";
import { lowercaseAt } from "./upcaseAt.js";
import assertUnreachable from "./assertUnreachable.js";
import only from "./only.js";
import maybeMap from "./maybeMap.js";
import applyMixins from "./applyMixins.js";

export type Concat<T, S, V> = string;

function falsish(x: any): boolean {
  return !!x === false;
}

function isValidPropertyAccessor(a: string): boolean {
  return (a.match(/[A-z_$]+[A-z0-9_$]*/) || [])[0] === a;
}

function not(x) {
  return !x;
}

function asPropertyAccessor(a: string): string {
  return isValidPropertyAccessor(a) ? a : `'${a}'`;
}
type PartialTuple<TUPLE extends any[], EXTRACTED extends any[] = []> =
  // If the tuple provided has at least one required value
  TUPLE extends [infer NEXT_PARAM, ...(infer REMAINING)] // recurse back in to this type with one less item // in the original tuple, and the latest extracted value // added to the extracted list as optional
    ? PartialTuple<REMAINING, [...EXTRACTED, NEXT_PARAM?]> // else if there are no more values, // return an empty tuple so that too is a valid option
    : [...EXTRACTED, ...TUPLE];
type PartialParameters<FN extends (...args: any[]) => any> = PartialTuple<
  Parameters<FN>
>;
type RemainingParameters<PROVIDED extends any[], EXPECTED extends any[]> =
  // if the expected array has any required items…
  EXPECTED extends [infer E1, ...(infer EX)] // if the provided array has at least one required item
    ? PROVIDED extends [infer P1, ...(infer PX)] // if the type is correct, recurse with one item less //in each array type
      ? P1 extends E1
        ? RemainingParameters<PX, EX> // else return this as invalid
        : never // else the remaining args is unchanged
      : EXPECTED // else there are no more arguments
    : [];

type CurriedFunctionOrReturnValue<
  PROVIDED extends any[],
  FN extends (...args: any[]) => any
> = RemainingParameters<PROVIDED, Parameters<FN>> extends [any, ...any[]]
  ? CurriedFunction<PROVIDED, FN>
  : ReturnType<FN>;

type CurriedFunction<
  PROVIDED extends any[],
  FN extends (...args: any[]) => any
> = <
  NEW_ARGS extends PartialTuple<RemainingParameters<PROVIDED, Parameters<FN>>>
>(
  ...args: NEW_ARGS
) => CurriedFunctionOrReturnValue<[...PROVIDED, ...NEW_ARGS], FN>;

function curry<
  FN extends (...args: any[]) => any,
  STARTING_ARGS extends PartialParameters<FN>
>(
  targetFn: FN,
  ...existingArgs: STARTING_ARGS
): CurriedFunction<STARTING_ARGS, FN> {
  return function(...args) {
    const totalArgs = [...existingArgs, ...args];
    if (totalArgs.length >= targetFn.length) {
      return targetFn(...totalArgs);
    }
    return curry(targetFn, ...(totalArgs as PartialParameters<FN>));
  };
}

const hexReg = /^[0-9A-Fa-f]+$/;
function isHex(h: string) {
  return hexReg.exec(h) != null;
}

export {
  curry,
  invariant,
  math,
  notEmpty,
  nullthrows,
  typedKeys,
  memoize,
  asString,
  debounce,
  keyById,
  readAndParse,
  stripSuffix,
  select,
  upcaseAt,
  lowercaseAt,
  assertUnreachable,
  falsish,
  isValidPropertyAccessor,
  not,
  only,
  maybeMap,
  asPropertyAccessor,
  isHex,
  applyMixins,
};
