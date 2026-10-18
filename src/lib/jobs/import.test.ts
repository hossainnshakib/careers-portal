import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import job04 from "../../../public/imports/job-04.json";
import job05 from "../../../public/imports/job-05.needs-review.json";
import template from "../../../public/imports/job-import-template.json";
import { importJobSchema, mapImportJob, parseImport, previewImport, maxImportBytes, type ImportCatalog } from "./import";
import { buildSchema } from "@/lib/validation/buildSchema";
import { QuestionFields } from "@/components/form-renderer/question-fields";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const catalog: ImportCatalog = {
  departments: [{ id: uuid(1), slug: "web-technical", isActive: true }, { id: uuid(2), slug: "design-creative", isActive: true }],
  brands: ["fixen-media", "accoraze", "builtale"].map((slug, i) => ({ id: uuid(10 + i), slug, status: "active" })),
  options: Object.entries({ arrangement: ["onsite", "hybrid"], engagement: ["full_time", "project-based"], experience: ["fresher-welcome", "entry", "mid"] })
    .flatMap(([group, slugs], i) => slugs.map((slug, j) => ({ id: uuid(20 + i * 10 + j), group, slug, isActive: true }))),
  jobs: [],
};
const raw = () => structuredClone(parseImport(JSON.stringify(job04)).jobs[0]);
describe("bulk import contract and approved datasets", () => {
  it("validates multiple jobs, published and draft, and the downloadable template", () => {
    const first = raw();
    const second = { ...raw(), title: "Another approved role", slug: "another-approved-role", status: "draft" as const };
    const parsed = parseImport(JSON.stringify({ version: 1, jobs: [first, second] }));
    expect(previewImport(parsed.jobs, catalog).map((row) => row.outcome)).toEqual(["create", "create"]);
    expect(mapImportJob(first, catalog).intent).toBe("publish");
    expect(mapImportJob(second, catalog).intent).toBe("save");
    expect(previewImport(parseImport(JSON.stringify(template)).jobs, catalog)[0].outcome).toBe("create");
  });
  it("preserves all approved Job 04 fields, skills, benefits and ordered questions/options", () => {
    const input = mapImportJob(raw(), catalog);
    expect(input.id).toBeNull();
    expect(input.brandIds).toEqual([uuid(10), uuid(11), uuid(12)]);
    expect(input.primaryBrandId).toBe(uuid(10));
    expect(input.departmentId).toBe(uuid(1));
    expect(input.locationText).toBe("Chittagong, Bangladesh");
    expect(input.cvRequired).toBe(true);
    expect(input.vacancies).toBe(2);
    expect(input.salaryMode).toBe("negotiable");
    expect(input.skills).toEqual(job04.jobs[0].skills);
    expect(input.benefits).toEqual(job04.jobs[0].benefits);
    expect(input.questions).toHaveLength(14);
    expect(input.questions.map((q) => q.label)).toEqual(job04.jobs[0].questions.map((q) => q.label));
    expect(input.questions.map((q) => q.required)).toEqual(job04.jobs[0].questions.map((q) => q.required));
    const choice = input.questions.find((q) => q.type === "single_choice")!;
    expect(choice.options).toEqual(job04.jobs[0].questions[10].options);
    expect(choice.config?.display).toBe("dropdown");
    expect(input.descriptionMd).toBe(job04.jobs[0].descriptionMd);
  });
  it("renders the imported choice as SELECT, with exact choice order and no radio controls", () => {
    const choice = mapImportJob(raw(), catalog).questions.find((q) => q.type === "single_choice")!;
    const html = renderToStaticMarkup(createElement(QuestionFields, {
      question: choice, value: undefined, other: "", onChange: () => {}, onOtherChange: () => {},
    }));
    expect(html).toContain("<select");
    expect(html).not.toContain('type="radio"');
    let last = -1;
    for (const option of choice.options!) {
      const position = html.indexOf(`>${option.label}</option>`);
      expect(position).toBeGreaterThan(last);
      last = position;
    }
  });
  it("keeps Job 05's exact text and blocks the three benefits exceeding existing limits", () => {
    expect(() => parseImport(JSON.stringify(job05))).toThrow("benefits");
    expect(job05.jobs[0].benefits.map((item) => item.length)).toEqual([64, 73, 47, 57, 65]);
    // Test the supported mapping independently; do not edit the approved dataset to pass validation.
    const review = importJobSchema.parse({ ...job05.jobs[0], benefits: [] });
    const input = mapImportJob(review, catalog);
    expect(input.brandIds).toEqual([uuid(10)]);
    const portfolio = input.questions.find((q) => q.label === "Portfolio or website")!;
    expect(portfolio.required).toBe(true);
    const schema = buildSchema([portfolio]);
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ [portfolio.id]: "https://example.com/portfolio" }).success).toBe(true);
    expect(input.questions.map((q) => q.label)).toEqual(job05.jobs[0].questions.map((q) => q.label));
    expect(input.questions.map((q) => q.required)).toEqual(job05.jobs[0].questions.map((q) => q.required));
  });
  it("skips existing and within-file duplicate slugs or normalized titles, never offering updates", () => {
    const first = raw();
    expect(previewImport([first], { ...catalog, jobs: [{ slug: "another-slug", title: `  ${first.title.toUpperCase()}  ` }] })[0].outcome).toBe("skip");
    expect(previewImport([first], { ...catalog, jobs: [{ slug: first.slug, title: "Other title" }] })[0].outcome).toBe("skip");
    expect(previewImport([first, { ...first, slug: "different-slug" }, { ...first, title: "Different title" }], catalog).map((row) => row.outcome)).toEqual(["create", "skip", "skip"]);
  });
  it.each(["brands", "departments", "options"] as const)("rejects missing %s references", (key) => {
    expect(previewImport([raw()], { ...catalog, [key]: [] })[0].outcome).toBe("error");
  });
  it("rejects hidden/inactive references and primary brands outside selection", () => {
    expect(previewImport([raw()], { ...catalog, brands: catalog.brands.map((b) => ({ ...b, status: "hidden" })) })[0].outcome).toBe("error");
    expect(previewImport([raw()], { ...catalog, options: catalog.options.map((o) => ({ ...o, isActive: false })) })[0].outcome).toBe("error");
    expect(previewImport([{ ...raw(), primaryBrand: "missing" }], catalog)[0].outcome).toBe("error");
  });
  it("rejects duplicate reference links, invalid question config, radios and absent portfolio requirements", () => {
    const first = raw();
    expect(previewImport([{ ...first, brands: ["fixen-media", "fixen-media"] }], catalog)[0].outcome).toBe("error");
    const radio = raw(); radio.questions[10].config = { display: "radio" };
    expect(previewImport([radio], catalog)[0].message).toContain("not radio");
    const bad = raw(); bad.questions[0].config = { min: 2 };
    expect(previewImport([bad], catalog)[0].outcome).toBe("error");
    expect(previewImport([{ ...first, portfolioRequired: true }], catalog)[0].outcome).toBe("error");
  });
  it("adds independent standard questions with required portfolio when requested", () => {
    const input = mapImportJob({ ...raw(), includeStandardQuestions: true, questions: [], portfolioRequired: true }, catalog);
    expect(input.questions).toHaveLength(7);
    expect(input.questions[1].required).toBe(true);
    const next = mapImportJob({ ...raw(), includeStandardQuestions: true, questions: [] }, catalog);
    expect(next.questions[1].id).not.toBe(input.questions[1].id);
    expect(next.questions[1].required).toBe(false);
  });
  it("uses dropdown when presentation is omitted; rejects invalid choices and range loss", () => {
    const first = raw(); first.questions[10].config = null;
    expect(mapImportJob(first, catalog).questions[10].config?.display).toBe("dropdown");
    first.questions[10].options = [];
    expect(previewImport([first], catalog)[0].outcome).toBe("error");
    expect(previewImport([{ ...raw(), salaryText: "10000" }], catalog)[0].outcome).toBe("error");
    expect(previewImport([{ ...raw(), salaryMode: "range", salaryText: "" }], catalog)[0].outcome).toBe("error");
  });
  it("requires publishing options but permits an unconfigured draft", () => {
    const first = { ...raw(), options: { arrangement: [], engagement: [], experience: [] } };
    expect(previewImport([first], catalog)[0].outcome).toBe("error");
    expect(previewImport([{ ...first, status: "draft" }], catalog)[0].outcome).toBe("create");
  });
  it.each(["short_text", "long_text", "single_choice", "multiple_choice", "yes_no", "number", "url", "email", "phone", "file_upload", "date"] as const)("maps the existing %s question type without changing wording/required flags", (type) => {
    const definition = {
      label: "Exact supplied wording", helpText: "Exact help", type, required: true,
      section: "role_specific" as const, config: null,
      options: type.endsWith("choice") ? [{ value: "a", label: "First" }, { value: "b", label: "Second" }] : null,
    };
    const input = mapImportJob({ ...raw(), questions: [definition] }, catalog);
    expect(input.questions[0]).toMatchObject({ ...definition, config: type === "single_choice" ? { display: "dropdown" } : null, sortOrder: 0 });
  });
  it("rejects invalid JSON, versions, unknown fields, supplied IDs, excessive size/count and field lengths", () => {
    for (const value of ["{", JSON.stringify({ ...job04, version: 2 }), JSON.stringify({ ...job04, unexpected: true }),
      JSON.stringify({ version: 1, jobs: [{ ...raw(), id: uuid(1) }] }),
      JSON.stringify({ version: 1, jobs: [{ ...raw(), summary: "x".repeat(201) }] }),
      JSON.stringify({ version: 1, jobs: Array.from({ length: 21 }, raw) }), " ".repeat(maxImportBytes + 1)])
      expect(() => parseImport(value)).toThrow();
  });
});
