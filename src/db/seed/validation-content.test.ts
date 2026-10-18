import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import { brandData, departmentData, optionData } from "./data";
import { validationJobs, ownsValidationJob } from "./validation-content";
import { demoDisclaimer, demoSlugs } from "@/lib/demo";
import { questionSectionEnum, questionTypeEnum } from "@/db/schema";
import { standardQuestions } from "@/lib/questions/defaults";
import { parseDemoCommand, approvedDemoProject } from "./validation-policy";

const catalog = {
  brands: brandData.map(row => ({ id: randomUUID(), slug: row.slug })),
  departments: departmentData.map(row => ({ id: randomUUID(), slug: row[1] })),
  options: optionData.map(row => ({ id: randomUUID(), slug: row.slug })),
};
it("builds exactly five stable, complete, unmistakably fictional jobs", () => {
  const jobs = validationJobs(catalog);
  expect(jobs).toEqual(validationJobs(catalog));
  expect(jobs.map(row => row.slug)).toEqual(demoSlugs);
  expect(new Set(jobs.map(row => row.title)).size).toBe(5);
  expect(new Set(jobs.map(row => row.departmentId)).size).toBe(5);
  expect(new Set(jobs.flatMap(row => row.brandIds)).size).toBe(8);
  expect(new Set(jobs.flatMap(row => row.optionIds)).size).toBe(13);
  expect(new Set(jobs.map(row => row.salaryMode))).toEqual(new Set(["range", "negotiable"]));
  for (const job of jobs) {
    expect(ownsValidationJob(job)).toBe(true);
    expect(job.summary).toContain(demoDisclaimer);
    for (const key of ["descriptionMd", "responsibilitiesMd", "requirementsMd", "niceToHaveMd", "locationText", "experienceText", "engagementNote"] as const) expect(job[key]?.length).toBeGreaterThan(10);
    expect(job.skills.length).toBeGreaterThanOrEqual(3);
    expect(job.benefits.every(text => text.includes("not an offer"))).toBe(true);
    expect(job.deadlineAt).toBe("2099-12-31T17:59:00.000Z");
    expect(job.intent).toBe("save");
    for (const standard of standardQuestions) expect(job.questions.some(q => q.label === standard.label && q.type === standard.type)).toBe(true);
  }
  const questions = jobs.flatMap(job => job.questions);
  expect(new Set(questions.map(q => q.type))).toEqual(new Set(questionTypeEnum.enumValues));
  expect(new Set(questions.map(q => q.section))).toEqual(new Set(questionSectionEnum.enumValues));
  expect(new Set(questions.map(q => q.required))).toEqual(new Set([true, false]));
  expect(new Set(questions.filter(q => q.type === "file_upload").flatMap(q => q.config?.accept as string[]))).toEqual(new Set(["pdf", "png", "jpg", "webp", "zip"]));
  expect(new Set(questions.map(q => q.id)).size).toBe(questions.length);
});
it("fails closed for missing base records and refuses prefix-only ownership", () => {
  expect(() => validationJobs({ ...catalog, brands: [] })).toThrow("Required base");
  const [job] = validationJobs(catalog);
  expect(ownsValidationJob({ ...job, slug: "demo-unrelated" })).toBe(false);
  expect(ownsValidationJob({ ...job, descriptionMd: "Owner-authored content" })).toBe(false);
  expect(ownsValidationJob({ ...job, title: "Actual role" })).toBe(false);
});
it.each(["seed", "publish", "cleanup"])("%s defaults to dry-run and needs both exact flags for writes", operation => {
  expect(parseDemoCommand([operation]).write).toBe(false);
  expect(parseDemoCommand([operation, "--write", `--confirm=${approvedDemoProject}`]).write).toBe(true);
  for (const flags of [["--write"], [`--confirm=${approvedDemoProject}`], ["--write", "--confirm=wrong"], ["--force"], ["--write", "--write"]])
    expect(() => parseDemoCommand([operation, ...flags])).toThrow();
});
