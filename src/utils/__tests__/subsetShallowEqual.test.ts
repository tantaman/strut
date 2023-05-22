import { describe, it, expect } from "vitest";
import subsetShallowEqual from "../subsetShallowEqual";

const data = [
  {
    desc: "empty sets",
    a: {},
    b: {},
    expected: true,
  },
  {
    desc: "subset is empty",
    a: {},
    b: { x: "y" },
    expected: true,
  },
  {
    desc: "sets are same",
    a: { x: "y" },
    b: { x: "y" },
    expected: true,
  },
  {
    desc: "subset is not subset",
    a: { x: "y" },
    b: {},
    expected: false,
  },
  {
    desc: "same keys but diff values",
    a: { x: 1 },
    b: { x: 2 },
    expected: false,
  },
  {
    desc: "subset",
    a: { x: 1 },
    b: { x: 1, y: 2 },
    expected: true,
  },
];

describe.each(data)("Subsets", (data) => {
  it(data.desc, () => {
    expect(subsetShallowEqual(data.a, data.b)).toBe(data.expected);
  });
});
