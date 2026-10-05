import { expect, it } from "vitest";
import type { JobQuestion } from "@/db/schema";
import { mayUpgradeDemoQuestions } from "./question-upgrade";
const timestamp = new Date("2026-09-01");
const job = { id: "seed", createdAt: timestamp, updatedAt: timestamp };
const baseline = [
  {
    id: "q",
    label: "Original",
    helpText: null,
    type: "number" as const,
    required: true,
    config: { integer: true, min: 0 },
    options: null,
    section: "experience" as const,
    sortOrder: 1,
  },
];
const row: JobQuestion = { ...baseline[0], jobId: "seed", createdAt: timestamp, archivedAt: null };
it("upgrades only untouched deterministic seed definitions with JSON-order independence", () => {
  expect(
    mayUpgradeDemoQuestions(job, "seed", [{ ...row, config: { min: 0, integer: true } }], baseline),
  ).toBe(true);
  for (const changed of [
    { ...row, label: "Owner edit" },
    { ...row, config: { min: 5 } },
    { ...row, archivedAt: timestamp },
    { ...row, required: false },
    { ...row, sortOrder: 2 },
  ])
    expect(mayUpgradeDemoQuestions(job, "seed", [changed], baseline)).toBe(false);
  expect(
    mayUpgradeDemoQuestions({ ...job, updatedAt: new Date("2026-09-02") }, "seed", [row], baseline),
  ).toBe(false);
  expect(mayUpgradeDemoQuestions(job, "other", [row], baseline)).toBe(false);
  expect(mayUpgradeDemoQuestions(job, "seed", [row, row], baseline)).toBe(false);
});
