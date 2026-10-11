import { expect, it } from "vitest";
import { checkJobCommand, checkJobEdit, removedQuestionIds } from "./job-policy";
import { jobInput } from "@/lib/validation/jobs";

const id = "10000000-0000-4000-8000-000000000001";
export const sampleJob = {
  id: null,
  title: "Test job",
  slug: "test-job",
  departmentId: id,
  brandIds: [id],
  primaryBrandId: id,
  optionIds: [],
  engagementNote: null,
  salaryMode: "negotiable",
  salaryText: "",
  vacancies: null,
  experienceText: null,
  skills: [],
  benefits: [],
  niceToHaveMd: "",
  locationText: "Dhaka",
  deadlineAt: null,
  cvRequired: true,
  summary: "Summary",
  descriptionMd: "Description",
  responsibilitiesMd: "Responsibilities",
  requirementsMd: "Requirements",
  questions: [],
  intent: "save",
} as const;
it("validates brands, primary, option uniqueness, summary, deadline and unknown fields", () => {
  expect(jobInput.safeParse(sampleJob).success).toBe(true);
  for (const bad of [
    { ...sampleJob, brandIds: [] },
    { ...sampleJob, brandIds: [id, id] },
    { ...sampleJob, primaryBrandId: "20000000-0000-4000-8000-000000000001" },
    { ...sampleJob, optionIds: [id, id] },
    { ...sampleJob, summary: "x".repeat(201) },
    { ...sampleJob, deadlineAt: "2026-10-05" },
    { ...sampleJob, status: "open" },
    { ...sampleJob, salaryMode: "range", salaryText: "" },
    { ...sampleJob, salaryMode: "range", salaryText: "৳ 1\n৳ 2" },
  ])
    expect(jobInput.safeParse(bad).success).toBe(false);
});
it("allows draft slug edits but prevents any postpublication change", () => {
  const input = jobInput.parse(sampleJob);
  expect(() => checkJobEdit({ slug: "old", publishedAt: null }, input)).not.toThrow();
  expect(() => checkJobEdit({ slug: "old", publishedAt: new Date() }, input)).toThrow();
  expect(() => checkJobEdit({ slug: input.slug, publishedAt: new Date() }, input)).not.toThrow();
});
it("finds removed active questions and prevents archived question resurrection", () => {
  const rows = [
    { id: "kept", archivedAt: null },
    { id: "removed", archivedAt: null },
    { id: "archived", archivedAt: new Date() },
  ];
  expect(removedQuestionIds(rows, ["kept"])).toEqual(["removed"]);
  expect(() => removedQuestionIds(rows, ["archived"])).toThrow();
});
it("restricts deletion and lifecycle transitions", () => {
  expect(() =>
    checkJobCommand({ status: "draft", publishedAt: null }, "delete", false),
  ).not.toThrow();
  for (const job of [
    { status: "open", publishedAt: new Date() },
    { status: "closed", publishedAt: new Date() },
    { status: "draft", publishedAt: new Date() },
  ] as const)
    expect(() => checkJobCommand(job, "delete", false)).toThrow();
  expect(() => checkJobCommand({ status: "draft", publishedAt: null }, "delete", true)).toThrow();
  expect(() => checkJobCommand({ status: "draft", publishedAt: null }, "close", false)).toThrow();
  expect(() =>
    checkJobCommand({ status: "open", publishedAt: new Date() }, "reopen", false),
  ).toThrow();
  expect(() =>
    checkJobCommand({ status: "open", publishedAt: new Date() }, "close", true),
  ).not.toThrow();
  expect(() =>
    checkJobCommand({ status: "closed", publishedAt: new Date() }, "reopen", true),
  ).not.toThrow();
});
