import { expect, it } from "vitest";
import { editLocalDeadline } from "./deadline";

it("preserves the local cutoff including seconds when changing just the date", () => {
  const original = new Date("2027-02-12T14:30:45.123").toISOString();
  expect(editLocalDeadline(original, "2027-02-13")).toBe(new Date("2027-02-13T14:30:45.123").toISOString());
});
it("uses explicit local time or midnight for new dates and never shifts the selected local day", () => {
  expect(editLocalDeadline(null, "2027-02-12")).toBe(new Date("2027-02-12T00:00").toISOString());
  expect(editLocalDeadline(null, "2027-02-12", "14:30")).toBe(new Date("2027-02-12T14:30").toISOString());
});
it("clears the instant with the date and tolerates invalid edit values without throwing", () => {
  expect(editLocalDeadline(new Date().toISOString(), "")).toBeNull();
  expect(editLocalDeadline(null, "invalid")).toBeNull();
});
