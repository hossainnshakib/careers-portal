import { expect, it } from "vitest";
import { newQuestion, nextOptionValue, questionTypeChoices, reorderQuestions } from "./editor";
import { questionDefinitionSchema } from "./definition";

it("provides the exact eleven-type chooser order and independently owned blank drafts", () => {
  expect(questionTypeChoices.map(([type]) => type)).toEqual(["short_text", "long_text", "single_choice", "multiple_choice", "yes_no", "number", "url", "email", "phone", "date", "file_upload"]);
  const first = newQuestion(0), second = newQuestion(1);
  expect(first.id).not.toBe(second.id); expect(first.sortOrder).toBe(0); expect(second.sortOrder).toBe(1);
  expect(questionDefinitionSchema.safeParse(first).success).toBe(false);
  expect(questionDefinitionSchema.safeParse({ ...first, label: "Valid question" }).success).toBe(true);
});
it("reorders without changing IDs/config/options or mutating the old definitions and rejects boundary moves", () => {
  const questions = [newQuestion(0), { ...newQuestion(1), config: { maxLength: 200 } }, newQuestion(2)];
  const before = structuredClone(questions);
  const next = reorderQuestions(questions, 0, 2);
  expect(next.map((question) => question.id)).toEqual([questions[1].id, questions[2].id, questions[0].id]);
  expect(next.map((question) => question.sortOrder)).toEqual([0, 1, 2]);
  expect(next[0].config).toEqual({ maxLength: 200 }); expect(questions).toEqual(before);
  expect(reorderQuestions(questions, 0, -1)).toBe(questions); expect(reorderQuestions(questions, 0, 3)).toBe(questions);
});
it("allocates unused choice values, while the original schema rejects duplicate/blank values and invalid bounds", () => {
  expect(nextOptionValue([{ value: "option_1" }, { value: "option_3" }])).toBe("option_2");
  const question = { ...newQuestion(0), label: "Choice", type: "single_choice" as const, options: [{ label: "A", value: "a" }, { label: "B", value: "a" }] };
  expect(questionDefinitionSchema.safeParse(question).success).toBe(false);
  expect(questionDefinitionSchema.safeParse({ ...question, options: [{ label: "A", value: "" }] }).success).toBe(false);
  expect(questionDefinitionSchema.safeParse({ ...question, options: [{ label: "A", value: "a" }], config: { display: "dropdown", allowOther: true } }).success).toBe(true);
  expect(questionDefinitionSchema.safeParse({ ...newQuestion(0), label: "Text", config: { minLength: 10, maxLength: 1 } }).success).toBe(false);
});
