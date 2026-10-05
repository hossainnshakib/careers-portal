import { describe, expect, it } from "vitest";
import { isCalendarDate, questionDefinitionSchema } from "./definition";

const question = {
  id: "10000000-0000-4000-8000-000000000001",
  label: "Join date",
  type: "date",
  required: false,
  section: "professional",
  sortOrder: 0,
};

describe("question definitions", () => {
  it("accepts date bounds and rejects invalid calendar dates and reversed bounds", () => {
    expect(
      questionDefinitionSchema.safeParse({
        ...question,
        config: { min: "today", max: "2028-02-29" },
      }).success,
    ).toBe(true);
    expect(
      questionDefinitionSchema.safeParse({ ...question, config: { min: "2027-02-29" } }).success,
    ).toBe(false);
    expect(
      questionDefinitionSchema.safeParse({
        ...question,
        config: { min: "2028-03-01", max: "2028-02-29" },
      }).success,
    ).toBe(false);
    expect(isCalendarDate("0000-01-01")).toBe(false);
  });
  it("checks choice presentation and Other config", () => {
    const choice = { ...question, type: "single_choice", options: [{ value: "a", label: "A" }] };
    expect(
      questionDefinitionSchema.safeParse({
        ...choice,
        config: { display: "dropdown", allowOther: true },
      }).success,
    ).toBe(true);
    expect(
      questionDefinitionSchema.safeParse({ ...choice, config: { display: "invalid" } }).success,
    ).toBe(false);
    expect(
      questionDefinitionSchema.safeParse({
        ...choice,
        options: [...choice.options, ...choice.options],
      }).success,
    ).toBe(false);
  });
  it("rejects cross-type config, unsafe file limits and reversed numeric limits", () => {
    expect(
      questionDefinitionSchema.safeParse({
        ...question,
        type: "number",
        config: { min: 5, max: 1 },
      }).success,
    ).toBe(false);
    expect(
      questionDefinitionSchema.safeParse({
        ...question,
        type: "file_upload",
        config: { accept: ["svg"] },
      }).success,
    ).toBe(false);
    expect(
      questionDefinitionSchema.safeParse({
        ...question,
        type: "file_upload",
        config: { maxSizeMb: 11 },
      }).success,
    ).toBe(false);
    expect(
      questionDefinitionSchema.safeParse({ ...question, config: { integer: true } }).success,
    ).toBe(false);
  });
});
