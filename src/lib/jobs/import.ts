import { z } from "zod";
import { jobInput, missingPublishGroups, type JobInput } from "@/lib/validation/jobs";
import { questionDefinitionSchema } from "@/lib/questions/definition";
import { copyStandardQuestions } from "@/lib/questions/defaults";

export const maxImportBytes = 750_000;
export const maxImportJobs = 20;
const fields = jobInput.shape;
const reference = z.string().trim().min(1).max(200);
const references = z.array(reference).max(50);
const qFields = questionDefinitionSchema.shape;
const question = z.strictObject({
  label: qFields.label, helpText: qFields.helpText, type: qFields.type,
  required: qFields.required, options: qFields.options, config: qFields.config, section: qFields.section,
});

/** References are catalog slugs, never client-selected database IDs. Unknown fields fail closed. */
export const importJobSchema = z.strictObject({
  title: fields.title,
  slug: fields.slug,
  department: reference,
  primaryBrand: reference,
  brands: references.min(1),
  options: z.strictObject({
    arrangement: references,
    engagement: references,
    experience: references,
  }),
  engagementNote: fields.engagementNote,
  salaryMode: fields.salaryMode,
  salaryText: fields.salaryText,
  vacancies: fields.vacancies,
  experienceText: fields.experienceText,
  skills: fields.skills,
  benefits: fields.benefits,
  niceToHaveMd: fields.niceToHaveMd,
  locationText: fields.locationText,
  deadlineAt: fields.deadlineAt,
  cvRequired: fields.cvRequired,
  portfolioRequired: z.boolean(),
  summary: fields.summary,
  descriptionMd: fields.descriptionMd,
  responsibilitiesMd: fields.responsibilitiesMd,
  requirementsMd: fields.requirementsMd,
  includeStandardQuestions: z.boolean(),
  questions: z.array(question).max(100),
  status: z.enum(["draft", "published"]),
});
export type ImportJob = z.infer<typeof importJobSchema>;
export const importFileSchema = z.strictObject({
  version: z.literal(1),
  jobs: z.array(importJobSchema).min(1).max(maxImportJobs),
});
export type ImportCatalog = {
  departments: { id: string; slug: string; isActive: boolean }[];
  brands: { id: string; slug: string; status: string }[];
  options: { id: string; slug: string; group: string; isActive: boolean }[];
  jobs: { slug: string; title: string }[];
};
export const identityKey = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

export function parseImport(text: string) {
  if (new TextEncoder().encode(text).length > maxImportBytes)
    throw new Error("JSON file must be no larger than 750 KB.");
  let data: unknown;
  try { data = JSON.parse(text); } catch { throw new Error("Invalid JSON file."); }
  const parsed = importFileSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues.slice(0, 30).map((issue) =>
    `${issue.path.join(".") || "file"}: ${issue.message}`).join("\n"));
  return parsed.data;
}

export function mapImportJob(raw: ImportJob, catalog: ImportCatalog): JobInput {
  if (raw.salaryMode === "negotiable" && raw.salaryText)
    throw new Error("Negotiable salary must have empty salaryText; range text would not be displayed.");
  const department = catalog.departments.find((row) => row.slug === raw.department && row.isActive);
  if (!department) throw new Error("Department must reference an active department slug.");
  const brandIds = raw.brands.map((slug) => {
    const brand = catalog.brands.find((row) => row.slug === slug && row.status === "active");
    if (!brand) throw new Error(`Unknown or hidden brand: ${slug}`);
    return brand.id;
  });
  const primary = catalog.brands.find((row) => row.slug === raw.primaryBrand);
  if (!primary || !raw.brands.includes(raw.primaryBrand))
    throw new Error("Primary brand must be one of the associated brands.");
  const selected = Object.entries(raw.options).flatMap(([group, slugs]) => slugs.map((slug) => {
    const option = catalog.options.find((row) => row.group === group && row.slug === slug && row.isActive);
    if (!option) throw new Error(`Unknown or inactive option: ${group}/${slug}`);
    return option;
  }));
  if (raw.status === "published" && missingPublishGroups(selected.map((row) => row.group as "arrangement" | "engagement" | "experience")).length)
    throw new Error("Published jobs require arrangement and engagement options.");
  const definitions = [
    ...(raw.includeStandardQuestions ? copyStandardQuestions().map((q) => ({ ...q,
      required: q.label === "Portfolio or website" && raw.portfolioRequired ? true : q.required,
    })) : []),
    ...raw.questions,
  ];
  const questions = definitions.map((q, sortOrder) => {
    if (q.type === "single_choice" && q.config?.display === "radio")
      throw new Error(`Single choice must use dropdown, not radio: ${q.label}`);
    return { ...q, id: crypto.randomUUID(), sortOrder,
      config: q.type === "single_choice" ? { ...q.config, display: "dropdown" } : q.config,
    };
  });
  if (raw.portfolioRequired && !questions.some((q) => q.type === "url" && q.section === "portfolio" && q.required))
    throw new Error("Portfolio required needs a required URL question in the portfolio section.");
  return jobInput.parse({
    title: raw.title, slug: raw.slug, engagementNote: raw.engagementNote,
    salaryMode: raw.salaryMode, salaryText: raw.salaryText, vacancies: raw.vacancies,
    experienceText: raw.experienceText, skills: raw.skills, benefits: raw.benefits,
    niceToHaveMd: raw.niceToHaveMd, locationText: raw.locationText, deadlineAt: raw.deadlineAt,
    cvRequired: raw.cvRequired, summary: raw.summary, descriptionMd: raw.descriptionMd,
    responsibilitiesMd: raw.responsibilitiesMd, requirementsMd: raw.requirementsMd,
    id: null, departmentId: department.id, brandIds, primaryBrandId: primary.id,
    optionIds: selected.map((row) => row.id), questions, intent: raw.status === "published" ? "publish" : "save",
  });
}

export type ImportPreviewRow = {
  index: number; title: string; slug: string; status: "draft" | "published";
  outcome: "create" | "skip" | "error"; message: string; questions: number;
};
export function previewImport(jobs: ImportJob[], catalog: ImportCatalog): ImportPreviewRow[] {
  const slugs = new Set<string>();
  const titles = new Set<string>();
  return jobs.map((job, index) => {
    const title = identityKey(job.title);
    const duplicate = slugs.has(job.slug) || titles.has(title);
    slugs.add(job.slug); titles.add(title);
    const base = { index, title: job.title, slug: job.slug, status: job.status,
      questions: job.questions.length + (job.includeStandardQuestions ? 7 : 0) };
    try {
      mapImportJob(job, catalog);
      if (duplicate || catalog.jobs.some((row) => row.slug === job.slug || identityKey(row.title) === title))
        return { ...base, outcome: "skip", message: duplicate ? "Duplicate within file; skipped." : "Existing slug or title; skipped without changes." };
      return { ...base, outcome: "create", message: "Validated; ready to create." };
    } catch (error) {
      return { ...base, outcome: "error", message: error instanceof z.ZodError
        ? error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
        : error instanceof Error ? error.message : "Invalid job." };
    }
  });
}
