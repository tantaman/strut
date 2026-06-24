// Fractional indexing for slide order (the `slide.sort` TEXT column). Reordering inserts a key
// between neighbors without renumbering siblings — Rindle has no built-in ordering primitive, so we
// bring our own (see RINDLE_NOTES.md "Ordering").

import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";

/** A key strictly after `prev` (or the first key when `prev` is undefined). */
export function keyAfter(prev: string | null | undefined): string {
  return generateKeyBetween(prev ?? null, null);
}

/** A key strictly between `a` and `b` (either may be null for an end). */
export function keyBetween(a: string | null | undefined, b: string | null | undefined): string {
  return generateKeyBetween(a ?? null, b ?? null);
}

/** `n` evenly-spaced keys between `a` and `b` — for seeding several slides at once. */
export function keysBetween(
  a: string | null | undefined,
  b: string | null | undefined,
  n: number,
): string[] {
  return generateNKeysBetween(a ?? null, b ?? null, n);
}
