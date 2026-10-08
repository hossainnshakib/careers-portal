import { expect, it } from "vitest";
import { formatAdminDate, applicationStatusLabel } from "./display";

it.each([
  ["2026-10-09T01:42:53.000Z", "9 Oct 2026, 7:42 AM"],
  ["2026-10-09T18:00:00.000Z", "10 Oct 2026, 12:00 AM"],
  ["2026-10-09T06:00:00.000Z", "9 Oct 2026, 12:00 PM"],
  ["2025-12-31T20:15:00.000Z", "1 Jan 2026, 2:15 AM"],
  ["2026-09-01T10:05:00.000Z", "1 Sep 2026, 4:05 PM"],
])("formats UTC input in Dhaka with English month/12-hour time: %s", (iso, expected) => {
  expect(formatAdminDate(iso)).toBe(expected);
});
it("never mutates stored Date values and handles invalid input safely", () => {
  const date = new Date("2026-10-09T01:42:53.000Z"); const before = date.toISOString();
  expect(formatAdminDate(date)).toBe("9 Oct 2026, 7:42 AM"); expect(date.toISOString()).toBe(before);
  expect(formatAdminDate("invalid")).toBe("Date unavailable");
});
it.each([
  ["new", "New"], ["under_review", "Under review"], ["shortlisted", "Shortlisted"], ["rejected", "Rejected"], ["hired", "Hired"],
] as const)("labels %s without modifying its stored value", (value, expected) => { expect(applicationStatusLabel(value)).toBe(expected); });
