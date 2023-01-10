import { test, expect } from "vitest";

import { validateLoginFields } from "../inputValidation.js";

test("test", () => {
  const cases = [
    [
      { email: "test", pass: "test" },
      { email: "test", pass: "test" },
    ],
    [{ email: [], pass: [] }, null],
    [{ email: "test" }, null],
    [{ pass: "test" }, null],
    [{}, null],
  ];
  for (const [input, output] of cases) {
    expect(validateLoginFields(input as any)).toEqual(output);
  }
});
