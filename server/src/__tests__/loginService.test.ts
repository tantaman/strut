import { test, expect } from "vitest";
import loginService from "../loginService.js";
import sqlite3 from "better-sqlite3";
import { apply } from "../schema.js";

test("register and correct login", async () => {
  const db = sqlite3(":memory:");
  apply(db);

  const assignedDbOnRegister = await loginService.register(db, "foo", "bar");
  const assignedDbOnLogin = await loginService.login(db, "foo", "bar");

  expect(assignedDbOnLogin).toEqual(assignedDbOnRegister);
});

test("register and bad login", async () => {
  const db = sqlite3(":memory:");
  apply(db);

  await loginService.register(db, "foo", "bar");
  expect(await loginService.login(db, "foo", "boo")).toBe(null);
});

test("register -- no dupes", async () => {
  const db = sqlite3(":memory:");
  apply(db);

  await loginService.register(db, "foo", "bar");
  expect(await loginService.register(db, "foo", "boo")).toBe(null);
});
