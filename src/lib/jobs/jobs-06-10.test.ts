import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import job06 from "../../../public/imports/job-06.json";
import job07 from "../../../public/imports/job-07.json";
import job08 from "../../../public/imports/job-08.json";
import job09 from "../../../public/imports/job-09.json";
import job10 from "../../../public/imports/job-10.json";
import { mapImportJob, parseImport, previewImport, type ImportCatalog, type ImportJob } from "./import";
import { buildSchema } from "@/lib/validation/buildSchema";
import { QuestionFields } from "@/components/form-renderer/question-fields";

// Content fingerprints were computed directly from the owner-approved master
// specification, not from the JSON files. CI does not need the owner's untracked
// source file. Markdown quotation/fence wrappers and line endings are normalized;
// question wording/flags/options, content paragraphs and list order are not changed.
const cases = [
  { number: "06", file: job06, title: "Advertising & Social Media Creative Designer", slug: "advertising-social-media-creative-designer", department: "design-creative", vacancies: 3, custom: 7,
    sourceDigest: "6767da350da42f6b648683ce0774e13f23bfa6f82e53926016170757b55f77c6",
    benefitIndex: 4, sourceBenefit: "Opportunity to work on both organic and paid campaign visuals", benefit: "Opportunity to work on organic and paid campaign visuals" },
  { number: "07", file: job07, title: "Visual Communication Designer", slug: "visual-communication-designer", department: "design-creative", vacancies: 2, custom: 6,
    sourceDigest: "fc234c1826c8959f6ade850bf22723272d9f21617926c0cd8772da213ed40b31",
    benefitIndex: 2, sourceBenefit: "Opportunity to work on multi-page and publication-style projects", benefit: "Chance to work on multi-page and publication-style projects" },
  { number: "08", file: job08, title: "Commercial & Documentary Video Editor", slug: "commercial-documentary-video-editor", department: "video-motion-production", vacancies: 3, custom: 7,
    sourceDigest: "c942463562ab3d74234bd1741992be9941b8fcf9317719da06e76024230144b8",
    benefitIndex: 4, sourceBenefit: "Opportunity to work across multiple video formats and industries", benefit: "Chance to work across multiple video formats and industries" },
  { number: "09", file: job09, title: "Short-Form & Social Media Video Editor", slug: "short-form-social-media-video-editor", department: "video-motion-production", vacancies: 4, custom: 7,
    sourceDigest: "ed9abcfe47b6c159f62ab3cdef829d888c6725d5f02ca0ddec328910ba217b5e",
    benefitIndex: 4, sourceBenefit: "Opportunity to help shape recurring short-form content formats", benefit: "Chance to help shape recurring short-form content formats" },
  { number: "10", file: job10, title: "Motion Graphics & Animation Artist", slug: "motion-graphics-animation-artist", department: "video-motion-production", vacancies: 2, custom: 7,
    sourceDigest: "e47b0d212e0fcb7596a47abdb350ccedae2c2037ba9fd65606062450800b0ab5",
    benefitIndex: 4, sourceBenefit: "Opportunity to develop reusable motion systems and advanced animation skills", benefit: "Build reusable motion systems and advanced animation skills" },
];
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const catalog: ImportCatalog = {
  departments: ["design-creative", "video-motion-production"].map((slug, i) => ({ id: uuid(i + 1), slug, isActive: true })),
  brands: [{ id: uuid(10), slug: "fixen-media", status: "active" }],
  options: Object.entries({ arrangement: ["onsite", "hybrid"], engagement: ["full_time", "project-based"], experience: ["fresher-welcome", "entry", "mid"] })
    .flatMap(([group, slugs], i) => slugs.map((slug, j) => ({ id: uuid(20 + i * 10 + j), group, slug, isActive: true }))),
  jobs: [],
};
const list = (value: string) => value.split("\n").map((line) => line.trim().replace(/^- /, "")).filter(Boolean);
function content(job: ImportJob) {
  const [niceToHaveMd, optional = ""] = job.niceToHaveMd.split("\n\n### Optional skills\n\n");
  return {
    summary: job.summary, descriptionMd: job.descriptionMd, responsibilitiesMd: job.responsibilitiesMd,
    requirementsMd: job.requirementsMd, niceToHaveMd, benefits: [...job.benefits], skills: job.skills,
    optionalSkills: list(optional), questions: job.questions.map((q) => ({
      label: q.label, type: q.type, required: q.required, options: q.options?.map((option) => option.label) ?? null,
    })),
  };
}

describe.each(cases)("approved Job $number import dataset", (entry) => {
  const job = parseImport(JSON.stringify(entry.file)).jobs[0];
  it("passes the actual importer, reference mapping and existing published-job validator", () => {
    expect(entry.file.jobs).toHaveLength(1);
    expect(job).toMatchObject({
      title: entry.title, slug: entry.slug, department: entry.department, primaryBrand: "fixen-media",
      brands: ["fixen-media"], locationText: "Chittagong, Bangladesh", salaryMode: "negotiable", salaryText: "",
      vacancies: entry.vacancies, cvRequired: true, portfolioRequired: true, status: "published",
      options: { arrangement: ["onsite", "hybrid"], engagement: ["full_time", "project-based"], experience: ["fresher-welcome", "entry", "mid"] },
    });
    const mapped = mapImportJob(job, catalog);
    expect(mapped.intent).toBe("publish");
    expect(mapped.departmentId).toBe(catalog.departments.find((row) => row.slug === entry.department)!.id);
    expect(mapped.primaryBrandId).toBe(catalog.brands[0].id);
    expect(mapped.benefits).toEqual(job.benefits);
    expect(mapped.skills).toEqual(job.skills);
    expect(previewImport([job], catalog)[0].outcome).toBe("create");
    expect(job.benefits).toHaveLength(5);
    expect(job.benefits.every((item) => item.length <= 60)).toBe(true);
    expect(job.summary.length).toBeLessThanOrEqual(200);
    expect(JSON.stringify(job)).not.toContain("Chattogram");
    expect(mapped.descriptionMd).toContain("Strong freshers");
    expect(mapped.requirementsMd).toContain("Formal professional experience is not mandatory");
  });
  it("preserves the approved source except the documented necessary length corrections", () => {
    expect(entry.sourceBenefit.length).toBeGreaterThan(60);
    expect(job.benefits[entry.benefitIndex]).toBe(entry.benefit);
    const restored = content(job);
    restored.benefits[entry.benefitIndex] = entry.sourceBenefit;
    if (entry.number === "10") {
      expect(restored.summary).toContain("good reels");
      restored.summary = restored.summary.replace("good reels", "quality reels");
      expect(restored.summary.length).toBe(203);
    }
    expect(createHash("sha256").update(JSON.stringify(restored)).digest("hex")).toBe(entry.sourceDigest);
    for (const skill of restored.optionalSkills) expect(job.skills).not.toContain(skill);
  });
  it("has exactly seven standards, the approved custom count and no duplicate questions", () => {
    expect(job.includeStandardQuestions).toBe(false);
    expect(job.questions).toHaveLength(7 + entry.custom);
    expect(job.questions.slice(0, 7).map((q) => q.required)).toEqual([false, true, true, false, false, false, true]);
    expect(job.questions.slice(0, 7).map((q) => q.type)).toEqual(["url", "url", "number", "short_text", "date", "number", "long_text"]);
    expect(job.questions.filter((q) => q.section === "role_specific")).toHaveLength(entry.custom);
    expect(new Set(job.questions.map((q) => q.label)).size).toBe(job.questions.length);
    expect(job.questions[2].config).toEqual({ integer: true, min: 0, max: 50 });
    expect(job.questions[4].config).toEqual({ min: "today" });
    expect(job.questions[6].config).toEqual({ maxLength: 1500 });
  });
  it("enforces a required portfolio/showreel without submitting an application", () => {
    const portfolio = mapImportJob(job, catalog).questions[1];
    expect(portfolio).toMatchObject({ type: "url", required: true, section: "portfolio" });
    const schema = buildSchema([portfolio]);
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ [portfolio.id]: "" }).success).toBe(false);
    expect(schema.safeParse({ [portfolio.id]: "https://example.com/showreel" }).success).toBe(true);
  });
  it("renders every single-choice question as a dropdown with unchanged ordered values", () => {
    const questions = mapImportJob(job, catalog).questions.filter((q) => q.type === "single_choice");
    expect(questions).toHaveLength(entry.number === "07" ? 2 : 1);
    for (const q of questions) {
      expect(q.config).toEqual({ display: "dropdown" });
      expect(q.options?.map((option) => option.value)).toEqual(q.options?.map((option) => option.label));
      const html = renderToStaticMarkup(createElement(QuestionFields, {
        question: q, value: undefined, other: "", onChange: () => {}, onOtherChange: () => {},
      }));
      expect(html).toContain("<select");
      expect(html).not.toContain('type="radio"');
      let last = -1;
      for (const option of q.options!) {
        const index = html.indexOf(`>${option.label}</option>`);
        expect(index).toBeGreaterThan(last);
        last = index;
      }
    }
  });
});

it("validates Jobs 06–10 together with unique slugs and titles and skips existing titles", () => {
  const parsed = parseImport(JSON.stringify({ version: 1, jobs: cases.flatMap((entry) => entry.file.jobs) }));
  expect(new Set(parsed.jobs.map((job) => job.slug)).size).toBe(5);
  expect(new Set(parsed.jobs.map((job) => job.title)).size).toBe(5);
  expect(previewImport(parsed.jobs, catalog).map((row) => row.outcome)).toEqual(Array(5).fill("create"));
  const existing = { ...catalog, jobs: parsed.jobs.map((job, i) => ({ slug: `existing-${i}`, title: job.title })) };
  expect(previewImport(parsed.jobs, existing).map((row) => row.outcome)).toEqual(Array(5).fill("skip"));
});
