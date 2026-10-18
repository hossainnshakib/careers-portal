import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import job16 from "../../../public/imports/job-16.json";
import job17 from "../../../public/imports/job-17.json";
import job18 from "../../../public/imports/job-18.json";
import job19 from "../../../public/imports/job-19.json";
import { mapImportJob, parseImport, previewImport, type ImportCatalog, type ImportJob } from "./import";
import { buildSchema } from "@/lib/validation/buildSchema";
import { QuestionFields } from "@/components/form-renderer/question-fields";

// Fingerprints come directly from the entire owner-approved master source with
// Markdown quotation/fence wrappers and line endings normalized. The source file
// remains owner-owned/untracked; CI needs only the datasets and these fingerprints.
// Job 18 explicitly permits URL or long text for its sample: use the existing URL
// type and retain the self-recorded-sample instruction as help text.
const cases = [
  { number: "16", file: job16, title: "Social Media & Community Manager", slug: "social-media-community-manager", department: "marketing-social", vacancies: 3,
    sourceDigest: "71643c24eef4993756dd1682976559191dabd4b7fb44f900920107f93ebcb927", dropdowns: 1, booleans: 0,
    engagement: ["full_time"], corrections: [] },
  { number: "17", file: job17, title: "Performance Marketing Specialist", slug: "performance-marketing-specialist", department: "marketing-social", vacancies: 2,
    sourceDigest: "9a80b1e17ffe73b6afd3e1cc1292412195a81b0a540c1c15259d62b8cfb59050", dropdowns: 1, booleans: 0,
    engagement: ["full_time", "project-based"],
    corrections: [{ index: 4, original: "Opportunity to develop deeper analytics and acquisition skills", shortened: "Chance to develop deeper analytics and acquisition skills" }] },
  { number: "18", file: job18, title: "On-Camera Presenter & Content Host", slug: "on-camera-presenter-content-host", department: "presentation-production-operations", vacancies: 3,
    sourceDigest: "0677343f5a5a1b429b279fdf54a982957ecde678d6a561a05ec5455b29590a5d", dropdowns: 2, booleans: 1,
    engagement: ["full_time", "part_time", "project-based"], corrections: [] },
  { number: "19", file: job19, title: "Production Coordinator", slug: "production-coordinator", department: "presentation-production-operations", vacancies: 2,
    sourceDigest: "47134f2d7a5f2aeb66934c36f3cca7ed624c2f3eb35e08f4d44a4d6bfea333d7", dropdowns: 0, booleans: 1,
    engagement: ["full_time"], corrections: [
      { index: 2, original: "Opportunity to collaborate with multiple creative disciplines", shortened: "Chance to collaborate with multiple creative disciplines" },
      { index: 4, original: "Opportunity to develop production and project-management skills", shortened: "Chance to develop production and project-management skills" },
    ] },
];
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const catalog: ImportCatalog = {
  departments: ["marketing-social", "presentation-production-operations"].map((slug, i) => ({ id: uuid(i + 1), slug, isActive: true })),
  brands: [{ id: uuid(10), slug: "fixen-media", status: "active" }],
  options: Object.entries({ arrangement: ["onsite", "hybrid"], engagement: ["full_time", "part_time", "project-based"], experience: ["fresher-welcome", "entry", "mid"] })
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
      label: q.label, type: q.type, required: q.required, helpText: q.helpText,
      options: q.options?.map((option) => option.label) ?? null,
    })),
  };
}

describe.each(cases)("approved Job $number import dataset", (entry) => {
  const job = parseImport(JSON.stringify(entry.file)).jobs[0];
  it("passes the actual importer and job validator with the exact role-specific selections", () => {
    expect(entry.file.jobs).toHaveLength(1);
    expect(job).toMatchObject({
      title: entry.title, slug: entry.slug, department: entry.department, primaryBrand: "fixen-media",
      brands: ["fixen-media"], locationText: "Chittagong, Bangladesh", salaryMode: "negotiable", salaryText: "",
      vacancies: entry.vacancies, cvRequired: true, portfolioRequired: false, status: "published",
    });
    expect(job.options).toEqual({ arrangement: entry.number === "18" ? ["onsite"] : ["onsite", "hybrid"],
      engagement: entry.engagement, experience: entry.number === "17" ? ["entry", "mid"] : ["fresher-welcome", "entry", "mid"],
    });
    const mapped = mapImportJob(job, catalog);
    expect(mapped.intent).toBe("publish");
    expect(mapped.departmentId).toBe(catalog.departments.find((row) => row.slug === entry.department)!.id);
    expect(mapped.primaryBrandId).toBe(catalog.brands[0].id);
    expect(mapped.vacancies).toBe(entry.vacancies);
    expect(mapped.benefits).toEqual(job.benefits);
    expect(mapped.skills).toEqual(job.skills);
    expect(previewImport([job], catalog)[0].outcome).toBe("create");
    expect(job.benefits).toHaveLength(5);
    expect(job.benefits.every((item) => item.length <= 60)).toBe(true);
    expect(job.summary.length).toBeLessThanOrEqual(200);
    expect(JSON.stringify(job)).not.toContain("Chattogram");
    expect(job.options.experience).not.toContain("senior");
  });
  it("preserves source content, optional skills, wording and ordered answer options", () => {
    const restored = content(job);
    for (const correction of entry.corrections) {
      expect(correction.original.length).toBeGreaterThan(60);
      expect(restored.benefits[correction.index]).toBe(correction.shortened);
      restored.benefits[correction.index] = correction.original;
    }
    expect(createHash("sha256").update(JSON.stringify(restored)).digest("hex")).toBe(entry.sourceDigest);
    for (const skill of restored.optionalSkills) expect(job.skills).not.toContain(skill);
  });
  it("has seven standards plus seven custom questions with exact required flags and no duplicates", () => {
    expect(job.includeStandardQuestions).toBe(false);
    expect(job.questions).toHaveLength(14);
    expect(job.questions.slice(0, 7).map((q) => q.required)).toEqual([false, false, true, false, false, false, true]);
    expect(job.questions.slice(0, 7).map((q) => q.type)).toEqual(["url", "url", "number", "short_text", "date", "number", "long_text"]);
    expect(job.questions.slice(7).map((q) => q.required)).toEqual(entry.number === "18"
      ? [true, true, true, true, true, false, true] : entry.number === "19" ? [true, true, true, true, false, true, false] : [true, true, true, true, true, true, false]);
    expect(job.questions.filter((q) => q.section === "role_specific")).toHaveLength(7);
    expect(new Set(job.questions.map((q) => q.label)).size).toBe(14);
    expect(job.questions[2].config).toEqual({ integer: true, min: 0, max: 50 });
    expect(job.questions[4].config).toEqual({ min: "today" });
    expect(job.questions[6].config).toEqual({ maxLength: 1500 });
  });
  it("keeps the standard portfolio/social/video profile optional", () => {
    const portfolio = mapImportJob(job, catalog).questions[1];
    expect(portfolio).toMatchObject({ type: "url", required: false, section: "portfolio" });
    const schema = buildSchema([portfolio]);
    expect(schema.safeParse({}).success).toBe(true);
    expect(schema.safeParse({ [portfolio.id]: "" }).success).toBe(true);
    expect(schema.safeParse({ [portfolio.id]: "https://example.com/profile" }).success).toBe(true);
  });
  it("renders single choice as dropdowns with unchanged ordered labels and values", () => {
    const questions = mapImportJob(job, catalog).questions.filter((q) => q.type === "single_choice");
    expect(questions).toHaveLength(entry.dropdowns);
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
        const index = html.indexOf(renderToStaticMarkup(createElement("option", { value: option.value }, option.label)));
        expect(index).toBeGreaterThan(last);
        last = index;
      }
    }
  });
  it("preserves required Yes/No answers as booleans, accepting both Yes and No", () => {
    const questions = mapImportJob(job, catalog).questions.filter((q) => q.type === "yes_no");
    expect(questions).toHaveLength(entry.booleans);
    for (const q of questions) {
      expect(q.required).toBe(true);
      expect(q.config).toBeNull();
      expect(q.options).toBeNull();
      const schema = buildSchema([q]);
      expect(schema.safeParse({}).success).toBe(false);
      expect(schema.safeParse({ [q.id]: true }).success).toBe(true);
      expect(schema.safeParse({ [q.id]: false }).success).toBe(true);
      expect(schema.safeParse({ [q.id]: "yes" }).success).toBe(false);
      const html = renderToStaticMarkup(createElement(QuestionFields, {
        question: q, value: false, other: "", onChange: () => {}, onOtherChange: () => {},
      }));
      expect(html).toContain("<select");
      expect(html).toContain('value="yes">Yes</option>');
      expect(html).toContain('value="no" selected="">No</option>');
      expect(html).not.toContain('type="radio"');
    }
  });
});

it("requires Job 18's on-camera sample even when the optional profile is omitted", () => {
  const job = parseImport(JSON.stringify(job18)).jobs[0];
  const mapped = mapImportJob(job, catalog);
  const profile = mapped.questions[1];
  const sample = mapped.questions[7];
  expect(sample).toMatchObject({ type: "url", required: true, section: "role_specific",
    helpText: "If someone has no previous professional work, a simple self-recorded sample should be accepted.",
  });
  const schema = buildSchema([profile, sample]);
  expect(schema.safeParse({}).success).toBe(false);
  expect(schema.safeParse({ [sample.id]: "" }).success).toBe(false);
  expect(schema.safeParse({ [sample.id]: "not a URL" }).success).toBe(false);
  expect(schema.safeParse({ [sample.id]: "https://example.com/self-recorded-sample" }).success).toBe(true);
  const html = renderToStaticMarkup(createElement(QuestionFields, {
    question: sample, value: undefined, other: "", onChange: () => {}, onOtherChange: () => {},
  }));
  expect(html).toContain(sample.helpText!);
});

it("validates the four datasets together and safely identifies existing titles", () => {
  const parsed = parseImport(JSON.stringify({ version: 1, jobs: cases.flatMap((entry) => entry.file.jobs) }));
  expect(new Set(parsed.jobs.map((job) => job.slug)).size).toBe(4);
  expect(new Set(parsed.jobs.map((job) => job.title)).size).toBe(4);
  expect(previewImport(parsed.jobs, catalog).map((row) => row.outcome)).toEqual(Array(4).fill("create"));
  const existing = { ...catalog, jobs: parsed.jobs.map((job, i) => ({ slug: `existing-${i}`, title: job.title })) };
  expect(previewImport(parsed.jobs, existing).map((row) => row.outcome)).toEqual(Array(4).fill("skip"));
});
