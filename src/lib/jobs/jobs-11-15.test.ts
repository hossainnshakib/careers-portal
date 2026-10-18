import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import job11 from "../../../public/imports/job-11.json";
import job12 from "../../../public/imports/job-12.json";
import job13 from "../../../public/imports/job-13.json";
import job14 from "../../../public/imports/job-14.json";
import job15 from "../../../public/imports/job-15.json";
import { mapImportJob, parseImport, previewImport, type ImportCatalog, type ImportJob } from "./import";
import { buildSchema } from "@/lib/validation/buildSchema";
import { jobInput } from "@/lib/validation/jobs";
import { QuestionFields } from "@/components/form-renderer/question-fields";

// Fingerprints were generated directly from the entire approved master source,
// normalizing only quotation/fence wrappers and line endings. The owner's
// untracked source is not required in CI. Reversing only the listed over-limit
// benefit corrections must reproduce all candidate content and ordered questions.
const cases = [
  { number: "11", file: job11, title: "Cinematographer", slug: "cinematographer", department: "video-motion-production", vacancies: 2,
    sourceDigest: "d498048595cd379c6ebbd60a69f928c1300c5bef750c73be35813eb99816fcb1",
    corrections: [{ index: 4, original: "Opportunity to develop stronger lighting and visual storytelling skills", shortened: "Develop stronger lighting and visual storytelling skills" }] },
  { number: "12", file: job12, title: "Product & Commercial Photographer", slug: "product-commercial-photographer", department: "video-motion-production", vacancies: 2,
    sourceDigest: "7060e933f1578cea257210c0f6ceeec68522cd0c531c4a116b08e7ede8ee84c8",
    corrections: [{ index: 2, original: "Opportunity to collaborate with creative and production teams", shortened: "Chance to collaborate with creative and production teams" }] },
  { number: "13", file: job13, title: "Creative Director & Production Lead", slug: "creative-director-production-lead", department: "video-motion-production", vacancies: 1,
    sourceDigest: "40be1135bd75f31fd7d36a105e13da3baed98260e3c166a6e894e862b6af1003",
    corrections: [{ index: 4, original: "Direct collaboration with business, marketing and production teams", shortened: "Work directly with business, marketing and production teams" }] },
  { number: "14", file: job14, title: "Script & Creative Content Writer", slug: "script-creative-content-writer", department: "content-copywriting", vacancies: 3,
    sourceDigest: "a9a9cfafe9c09f6211e24ab0b137e18c062372c6381e345cc0371cbe3a8d4637",
    corrections: [{ index: 2, original: "Opportunity to collaborate with creative and production teams", shortened: "Chance to collaborate with creative and production teams" }] },
  { number: "15", file: job15, title: "SEO, Website & Brand Content Writer", slug: "seo-website-brand-content-writer", department: "content-copywriting", vacancies: 3,
    sourceDigest: "b29ea19646f3f8142debe88eb964a48135d0ed6b16538e1f4137570d1030ceef",
    corrections: [
      { index: 0, original: "Work on website and long-form content across multiple industries", shortened: "Work on website and long-form content across industries" },
      { index: 4, original: "Opportunity to build a diverse professional writing portfolio", shortened: "Chance to build a diverse professional writing portfolio" },
    ] },
];
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const catalog: ImportCatalog = {
  departments: ["video-motion-production", "content-copywriting"].map((slug, i) => ({ id: uuid(i + 1), slug, isActive: true })),
  brands: [{ id: uuid(10), slug: "fixen-media", status: "active" }],
  options: Object.entries({ arrangement: ["onsite", "hybrid"], engagement: ["full_time", "project-based"], experience: ["fresher-welcome", "entry", "mid", "senior"] })
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
  it("passes the actual importer and job validator with approved configuration and eligibility", () => {
    expect(entry.file.jobs).toHaveLength(1);
    expect(job).toMatchObject({
      title: entry.title, slug: entry.slug, department: entry.department, primaryBrand: "fixen-media",
      brands: ["fixen-media"], locationText: "Chittagong, Bangladesh", salaryMode: "negotiable", salaryText: "",
      vacancies: entry.vacancies, cvRequired: true, portfolioRequired: true, status: "published",
    });
    expect(job.options).toEqual({ arrangement: ["onsite", "hybrid"],
      engagement: entry.number === "13" ? ["full_time"] : ["full_time", "project-based"],
      experience: entry.number === "13" ? ["mid", "senior"] : ["fresher-welcome", "entry", "mid"],
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
    if (entry.number === "13") {
      expect(mapped.descriptionMd).toContain("This is not intended as an entry-level position.");
      expect(mapped.requirementsMd).toContain("Meaningful experience in creative direction");
      expect(job.options.experience).not.toContain("fresher-welcome");
    } else {
      expect(mapped.descriptionMd).toContain("Strong freshers");
      expect(mapped.requirementsMd).toContain("Formal professional experience is not mandatory");
    }
  });
  it("preserves source text and optional skills with only the necessary benefit shortening", () => {
    const restored = content(job);
    for (const correction of entry.corrections) {
      expect(correction.original.length).toBeGreaterThan(60);
      expect(restored.benefits[correction.index]).toBe(correction.shortened);
      restored.benefits[correction.index] = correction.original;
    }
    expect(createHash("sha256").update(JSON.stringify(restored)).digest("hex")).toBe(entry.sourceDigest);
    for (const skill of restored.optionalSkills) expect(job.skills).not.toContain(skill);
  });
  it("keeps seven standards and seven customs in exact order with the original required flags", () => {
    expect(job.includeStandardQuestions).toBe(false);
    expect(job.questions).toHaveLength(14);
    expect(job.questions.slice(0, 7).map((q) => q.required)).toEqual([false, true, true, entry.number === "13", false, false, true]);
    expect(job.questions.slice(0, 7).map((q) => q.type)).toEqual(["url", "url", "number", "short_text", "date", "number", "long_text"]);
    expect(job.questions.slice(7).map((q) => q.required)).toEqual(entry.number === "13"
      ? Array(7).fill(true) : entry.number === "15" ? [true, true, true, true, true, false, true] : [true, true, true, true, true, true, false]);
    expect(job.questions.filter((q) => q.section === "role_specific")).toHaveLength(7);
    expect(new Set(job.questions.map((q) => q.label)).size).toBe(14);
    expect(job.questions[2].config).toEqual({ integer: true, min: 0, max: 50 });
    expect(job.questions[4].config).toEqual({ min: "today" });
    expect(job.questions[6].config).toEqual({ maxLength: 1500 });
  });
  it("enforces required portfolio/reel/writing links without submitting an application", () => {
    const mapped = mapImportJob(job, catalog);
    const portfolio = mapped.questions[1];
    expect(portfolio).toMatchObject({ type: "url", required: true, section: "portfolio" });
    const schema = buildSchema([portfolio]);
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ [portfolio.id]: "" }).success).toBe(false);
    expect(schema.safeParse({ [portfolio.id]: "https://example.com/work-samples" }).success).toBe(true);
    const employment = mapped.questions[3];
    expect(buildSchema([employment]).safeParse({}).success).toBe(entry.number !== "13");
  });
  it("renders every supplied single choice as a dropdown preserving ordered labels and values", () => {
    const questions = mapImportJob(job, catalog).questions.filter((q) => q.type === "single_choice");
    expect(questions).toHaveLength(["14", "15"].includes(entry.number) ? 0 : 1);
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
        const expected = renderToStaticMarkup(createElement("option", { value: option.value }, option.label));
        const index = html.indexOf(expected);
        expect(index).toBeGreaterThan(last);
        last = index;
      }
    }
  });
  it("uses ordinary editable salary, benefit, experience and vacancy fields", () => {
    const mapped = mapImportJob(job, catalog);
    expect(jobInput.safeParse({ ...mapped, intent: "save", salaryMode: "range", salaryText: "Administrator-configured range",
      vacancies: 5, benefits: ["Administrator-configured benefit"], experienceText: "Administrator-configured experience",
      optionIds: catalog.options.filter((option) => option.group === "experience" && option.slug === "mid").map((option) => option.id),
    }).success).toBe(true);
  });
});

it("validates all five approved datasets together and skips matching titles without updating jobs", () => {
  const parsed = parseImport(JSON.stringify({ version: 1, jobs: cases.flatMap((entry) => entry.file.jobs) }));
  expect(new Set(parsed.jobs.map((job) => job.slug)).size).toBe(5);
  expect(new Set(parsed.jobs.map((job) => job.title)).size).toBe(5);
  expect(previewImport(parsed.jobs, catalog).map((row) => row.outcome)).toEqual(Array(5).fill("create"));
  const existing = { ...catalog, jobs: parsed.jobs.map((job, i) => ({ slug: `existing-${i}`, title: job.title })) };
  expect(previewImport(parsed.jobs, existing).map((row) => row.outcome)).toEqual(Array(5).fill("skip"));
});
