import { expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ rows: [] as object[] }));
vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ getDb: () => ({ select: () => {
  const chain = { from: () => chain, leftJoin: () => chain, where: () => chain, orderBy: async () => state.rows };
  return chain;
} }) }));
import { loadDisplayAnswers } from "./application-answers";
it("retains raw/snapshot data while enriching labels, including missing linked definitions", async () => {
  const answer = { id: "synthetic-answer", value: "skill_0", labelSnapshot: "Original question", typeSnapshot: "single_choice", optionsSnapshot: [{ value: "skill_0", label: "Original option" }] };
  state.rows = [{ answer, questionOptions: [{ value: "skill_0", label: "Current option" }] }, { answer: { ...answer, id: "missing", questionId: null }, questionOptions: null }];
  const rows = await loadDisplayAnswers("synthetic-application");
  expect(rows[0]).toMatchObject(answer);
  expect(rows[1].questionOptions).toBeNull();
  expect(answer.value).toBe("skill_0");
});
