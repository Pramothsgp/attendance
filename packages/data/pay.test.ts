import { expect, test } from "bun:test";
import { dayEarning, isDay, isMonth, monthRange } from "./pay.ts";

test("daily wage: full, half, leave", () => {
  expect(dayEarning("daily", 600, "full")).toBe(600);
  expect(dayEarning("daily", 600, "half")).toBe(300);
  expect(dayEarning("daily", 600, "leave")).toBe(0);
});

test("monthly salary is per day over 30 and adds back to the salary", () => {
  const day = dayEarning("monthly", 10_000, "full");
  expect(day).toBe(333.3333);
  expect(Math.round(day * 30 * 100) / 100).toBe(10_000);
  expect(dayEarning("monthly", 9_000, "half")).toBe(150);
});

test("month range handles month lengths and leap years", () => {
  expect(monthRange("2026-11")).toEqual({ from: "2026-11-01", to: "2026-11-30" });
  expect(monthRange("2028-02")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
  expect(monthRange("2026-12")).toEqual({ from: "2026-12-01", to: "2026-12-31" });
});

test("input checks", () => {
  expect(isDay("2026-11-20")).toBe(true);
  expect(isDay("2026-13-01")).toBe(false);
  expect(isDay("20-11-2026")).toBe(false);
  expect(isDay("2026-02-31")).toBe(false);
  expect(isMonth("2026-11")).toBe(true);
  expect(isMonth("2026-13")).toBe(false);
});
