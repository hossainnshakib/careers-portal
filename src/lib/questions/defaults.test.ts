import { expect, it } from "vitest";
import { standardQuestions, copyStandardQuestions } from "./defaults";
import { questionDefinitionSchema } from "./definition";
it("copies the seven exact standards with valid independent editable IDs/configs", () => {
  const first = copyStandardQuestions(5);
  const second = copyStandardQuestions();
  expect(first).toHaveLength(7);
  expect(first.map((q) => q.label)).toEqual(standardQuestions.map((q) => q.label));
  expect(new Set([...first, ...second].map((q) => q.id)).size).toBe(14);
  for (const [index, q] of first.entries()) {
    expect(questionDefinitionSchema.safeParse(q).success).toBe(true);
    expect(q.sortOrder).toBe(5 + index);
  }
  first[2].label = "Changed";
  if (first[2].config) first[2].config.max = 20;
  first.reverse();
  first.pop();
  expect(second[2].label).toBe("Years of relevant experience");
  expect(second[2].config?.max).toBe(50);
  expect(standardQuestions[2].config.max).toBe(50);
});
