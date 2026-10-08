import { describe, expect, it } from "vitest";
import type { QuestionDefinition } from "@/lib/questions/definition";
import { maxAnswerCharacters, validateApplicationAnswers } from "./application";

const cvToken = "20000000-0000-4000-8000-000000000001";
function question(index: number, overrides: Partial<QuestionDefinition> = {}): QuestionDefinition {
  return {
    id: `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    label: `Question ${index}`,
    type: "long_text",
    required: true,
    section: "role_specific",
    sortOrder: index,
    helpText: null,
    config: null,
    options: null,
    ...overrides,
  };
}
function values(questions: QuestionDefinition[], text: string) {
  return Object.fromEntries(questions.map((entry) => [entry.id, text]));
}
function count(characters: number) {
  return Array.from({ length: characters }, () => "x").join("");
}

describe("validateApplicationAnswers answer budget", () => {
  it("accepts answers within the shared budget", () => {
    const questions = [question(1), question(2)];
    const answers = validateApplicationAnswers(questions, { [questions[0].id]: count(1000), [questions[1].id]: count(2000) }, [], false);
    expect(Object.keys(answers.answers)).toHaveLength(2);
    expect(answers.files).toEqual([]);
  });
  it("accepts answers exactly at the shared budget", () => {
    const questions = Array.from({ length: 5 }, (_, index) => question(index + 1));
    expect(() => validateApplicationAnswers(questions, values(questions, count(10_000)), [], false)).not.toThrow();
  });
  it("rejects a single submission whose combined answers exceed the shared budget", () => {
    const questions = Array.from({ length: 6 }, (_, index) => question(index + 1));
    expect(() => validateApplicationAnswers(questions, values(questions, count(10_000)), [], false)).toThrow(maxAnswerCharacters.toString());
  });
  it("counts choice answers toward the same budget", () => {
    const textQuestions = Array.from({ length: 5 }, (_, index) => question(index + 1));
    const choices = question(6, {
      type: "multiple_choice",
      options: [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ],
    });
    const combined = [...textQuestions, choices];
    expect(() =>
      validateApplicationAnswers(combined, { ...values(textQuestions, count(10_000)), [choices.id]: ["a", "b"] }, [], false),
    ).toThrow(maxAnswerCharacters.toString());
    expect(() => validateApplicationAnswers(textQuestions, values(textQuestions, count(10_000)), [], false)).not.toThrow();
  });
  it("still collects file references", () => {
    const files = validateApplicationAnswers([], {}, [cvToken], true);
    expect(files.files).toEqual([{ id: cvToken, slot: "cv" }]);
  });
});
