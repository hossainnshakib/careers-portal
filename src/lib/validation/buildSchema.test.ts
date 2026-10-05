import { afterEach, describe, expect, it, vi } from "vitest";
import type { QuestionDefinition } from "@/lib/questions/definition";
import { buildSchema } from "./buildSchema";

const id = "10000000-0000-4000-8000-000000000001";
const token = "20000000-0000-4000-8000-000000000001";
function question(
  type: QuestionDefinition["type"],
  overrides: Partial<QuestionDefinition> = {},
): QuestionDefinition {
  return {
    id,
    label: "Question",
    type,
    required: true,
    section: "role_specific",
    sortOrder: 0,
    helpText: null,
    config: null,
    options: type.endsWith("choice")
      ? [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]
      : null,
    ...overrides,
  };
}
function valid(q: QuestionDefinition, value: unknown) {
  return buildSchema([q]).safeParse({ [id]: value }).success;
}

describe("buildSchema", () => {
  afterEach(() => vi.useRealTimers());
  const cases: [QuestionDefinition["type"], unknown, unknown][] = [
    ["short_text", "শ্রীময়ী", ""],
    ["long_text", "A meaningful explanation", " "],
    ["single_choice", "a", "not-an-option"],
    ["multiple_choice", ["a", "b"], ["a", "wrong"]],
    ["yes_no", false, "false"],
    ["number", 3, "3"],
    ["url", "https://example.com", "javascript:alert(1)"],
    ["email", "test@example.com", "not-email"],
    ["phone", "01712345678", "1234"],
    ["file_upload", [token], ["pending/someone-else/file.pdf"]],
    ["date", "2028-02-29", "2027-02-29"],
  ];
  it.each(cases)("%s accepts a valid value and rejects an invalid value", (type, good, bad) => {
    expect(valid(question(type), good)).toBe(true);
    expect(valid(question(type), bad)).toBe(false);
  });
  it.each(cases)("%s enforces required and permits omitted optional answers", (type) => {
    expect(buildSchema([question(type)]).safeParse({}).success).toBe(false);
    const optional = buildSchema([question(type, { required: false })]);
    for (const empty of [undefined, null, "", "  ", []])
      expect(optional.safeParse({ [id]: empty }).success).toBe(true);
  });
  it("preserves false and zero optional answers", () => {
    expect(buildSchema([question("yes_no", { required: false })]).parse({ [id]: false })[id]).toBe(
      false,
    );
    expect(buildSchema([question("number", { required: false })]).parse({ [id]: 0 })[id]).toBe(0);
  });
  it("trims text and enforces text bounds including Bengali", () => {
    const q = question("long_text", { config: { minLength: 3, maxLength: 10 } });
    expect(buildSchema([q]).parse({ [id]: "  Hello  " })[id]).toBe("Hello");
    expect(valid(q, "ab")).toBe(false);
    expect(valid(q, "a".repeat(11))).toBe(false);
    expect(valid(question("short_text"), "a".repeat(301))).toBe(false);
  });
  it("enforces inclusive number bounds, integer and finite values", () => {
    const q = question("number", { config: { min: 0, max: 50, integer: true } });
    for (const value of [0, 50]) expect(valid(q, value)).toBe(true);
    for (const value of [-1, 51, 1.2, NaN, Infinity]) expect(valid(q, value)).toBe(false);
  });
  it("limits choices, rejects duplicates and unknown values", () => {
    const q = question("multiple_choice", { config: { minSelected: 2, maxSelected: 2 } });
    expect(valid(q, ["a", "b"])).toBe(true);
    for (const value of [["a"], ["a", "a"], ["a", "b", "c"], []])
      expect(valid(q, value)).toBe(false);
  });
  it.each(["radio", "dropdown"])(
    "permits single Other text with %s presentation and persists plain text",
    (display) => {
      const q = question("single_choice", { config: { allowOther: true, display } });
      const result = buildSchema([q]).parse({ [id]: "  অন্য দক্ষতা  " });
      expect(JSON.parse(JSON.stringify(result))[id]).toBe("অন্য দক্ষতা");
      expect(valid(q, " ")).toBe(false);
      expect(valid(q, { other: "text" })).toBe(false);
      expect(valid(q, "a".repeat(501))).toBe(false);
      expect(valid(question("single_choice", { config: { allowOther: false } }), "other")).toBe(
        false,
      );
    },
  );
  it("allows one Other value alongside multiple choices and persists a plain array", () => {
    const q = question("multiple_choice", { config: { allowOther: true } });
    expect(buildSchema([q]).parse({ [id]: ["a", " Other skill "] })[id]).toEqual([
      "a",
      "Other skill",
    ]);
    for (const value of [
      ["a", " "],
      ["other1", "other2"],
      ["a", { other: "text" }],
    ])
      expect(valid(q, value)).toBe(false);
    expect(valid(question("multiple_choice"), ["a", "Other skill"])).toBe(false);
  });
  it("accepts http/https only", () => {
    for (const value of ["http://example.com", "https://example.com/path?q=1"])
      expect(valid(question("url"), value)).toBe(true);
    for (const value of ["ftp://example.com", "data:text/html,hi", "/relative", "https://"])
      expect(valid(question("url"), value)).toBe(false);
  });
  it("normalizes Bangladesh and international phone formatting", () => {
    const q = question("phone");
    for (const value of ["01712345678", "+8801712345678", "+880 1712-345678", "+1 (212) 555-0123"])
      expect(valid(q, value)).toBe(true);
    for (const value of ["01212345678", "+8801212345678", "8801712345678", "+0000000000"])
      expect(valid(q, value)).toBe(false);
    expect(buildSchema([q]).parse({ [id]: "+880 1712-345678" })[id]).toBe("+8801712345678");
  });
  it("rejects invalid calendar dates and timestamps", () => {
    for (const value of [
      "2028-04-31",
      "2028-13-01",
      "2028-00-01",
      "2028-01-00",
      "2028-2-9",
      "0000-01-01",
      "2028-02-29T00:00:00Z",
    ])
      expect(valid(question("date"), value)).toBe(false);
    expect(valid(question("date"), "2000-02-29")).toBe(true);
    expect(valid(question("date"), "1900-02-29")).toBe(false);
  });
  it("uses inclusive absolute date bounds", () => {
    const q = question("date", { config: { min: "2028-02-28", max: "2028-03-01" } });
    for (const value of ["2028-02-28", "2028-02-29", "2028-03-01"])
      expect(valid(q, value)).toBe(true);
    for (const value of ["2028-02-27", "2028-03-02"]) expect(valid(q, value)).toBe(false);
  });
  it("resolves today at parse time using the current UTC date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2028-02-29T23:59:00Z"));
    const schema = buildSchema([question("date", { config: { min: "today", max: "today" } })]);
    expect(schema.safeParse({ [id]: "2028-02-29" }).success).toBe(true);
    expect(schema.safeParse({ [id]: "2028-02-28" }).success).toBe(false);
    expect(schema.safeParse({ [id]: "2028-03-01" }).success).toBe(false);
    vi.setSystemTime(new Date("2028-03-01T00:01:00Z"));
    expect(schema.safeParse({ [id]: "2028-02-29" }).success).toBe(false);
    expect(schema.safeParse({ [id]: "2028-03-01" }).success).toBe(true);
  });
  it("enforces unique opaque file tokens and the application-wide ceiling", () => {
    expect(valid(question("file_upload"), [token, token])).toBe(false);
    expect(
      valid(
        question("file_upload"),
        Array.from(
          { length: 9 },
          (_, n) => `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
        ),
      ),
    ).toBe(false);
  });
  it("rejects unknown answer keys, duplicate IDs and invalid question config", () => {
    expect(buildSchema([]).safeParse({ tampered: true }).success).toBe(false);
    expect(() => buildSchema([question("number"), question("date")])).toThrow(
      "Duplicate question ID",
    );
    expect(() => buildSchema([question("number", { config: { min: 10, max: 0 } })])).toThrow();
  });
});
