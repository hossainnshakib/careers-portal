import "server-only";

import { and, asc, eq, gt, isNull, ne, or } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getDb } from "@/db";
import { brands, departments, jobBrands, jobOptionLinks, jobOptions, jobQuestions, jobs } from "@/db/schema";
import { questionFromRow } from "@/lib/questions/from-row";
import type { JobCard, PublicBrand } from "@/lib/careers/filters";
import type { OptionTag } from "@/lib/careers/option-labels";

export const loadPublicCatalog = cache(unstable_cache(async () => {
  const db = getDb();
  // The public layout and home share this request-local memoized read. Keep
  // its bounded statements sequential on the same pooler as admin read sets.
  const rows = await db.select().from(jobs).where(and(eq(jobs.status, "open"), or(isNull(jobs.deadlineAt), gt(jobs.deadlineAt, new Date())))).orderBy(asc(jobs.sortOrder), asc(jobs.title));
  const brandRows = await db.select().from(brands).where(eq(brands.status, "active")).orderBy(asc(brands.sortOrder));
  const departmentRows = await db.select().from(departments).orderBy(asc(departments.sortOrder));
  const links = await db.select().from(jobBrands);
  const optionRows = await db.select().from(jobOptions)
    .where(eq(jobOptions.isActive, true))
    .orderBy(asc(jobOptions.group), asc(jobOptions.sortOrder), asc(jobOptions.id));
  const optionLinks = await db.select().from(jobOptionLinks);
  const tagById = new Map(optionRows.map((option) => [option.id, { group: option.group, slug: option.slug, label: option.label } satisfies OptionTag]));
  const tagsByJob = new Map<string, OptionTag[]>();
  for (const link of optionLinks) {
    const tag = tagById.get(link.optionId);
    if (!tag) continue;
    const list = tagsByJob.get(link.jobId) ?? [];
    list.push(tag);
    tagsByJob.set(link.jobId, list);
  }
  const publicBrands: PublicBrand[] = brandRows.map(({ id, name, slug, sector, logoUrl, description, accentColor, website }) =>
    ({ id, name, slug, sector, logoUrl, description, accentColor, website }));
  const cards: JobCard[] = rows.flatMap((job) => {
    const department = departmentRows.find((d) => d.id === job.departmentId);
    const linked = links.filter((l) => l.jobId === job.id);
    const visible = publicBrands.filter((b) => linked.some((l) => l.brandId === b.id));
    if (!department || !visible.length) return [];
    return [{ id: job.id, title: job.title, slug: job.slug, summary: job.summary,
      locationText: job.locationText, engagementNote: job.engagementNote,
      salaryMode: job.salaryMode, salaryText: job.salaryText, vacancies: job.vacancies,
      experienceText: job.experienceText,
      options: (tagsByJob.get(job.id) ?? []).sort((a, b) => optionRows.findIndex(option => option.group === a.group && option.slug === a.slug) - optionRows.findIndex(option => option.group === b.group && option.slug === b.slug)),
      department: { name: department.name, slug: department.slug },
      brands: visible, primaryBrandId: linked.find((l) => l.isPrimary)?.brandId ?? visible[0].id }];
  });
  return { jobs: cards, brands: publicBrands, departments: departmentRows.map(({ name, slug }) => ({ name, slug })), jobOptions: [...tagById.values()] };
}, ["public-catalog"], { tags: ["jobs", "brands", "departments"], revalidate: 300 }));

/** Uncached authoritative definition for upload and submit authorization. */
export async function loadApplicationJob(slug: string, db: Pick<ReturnType<typeof getDb>, "select"> = getDb()) {
  const [job] = await db.select().from(jobs).where(and(eq(jobs.slug, slug), ne(jobs.status, "draft"))).limit(1).for("share");
  if (!job) return null;
  const [department] = await db.select().from(departments).where(eq(departments.id, job.departmentId));
  const links = await db.select({ brand: brands, primary: jobBrands.isPrimary }).from(jobBrands)
    .innerJoin(brands, eq(brands.id, jobBrands.brandId)).where(eq(jobBrands.jobId, job.id));
  const questions = await db.select().from(jobQuestions)
    .where(and(eq(jobQuestions.jobId, job.id), isNull(jobQuestions.archivedAt))).orderBy(asc(jobQuestions.sortOrder));
  const optionLinks = await db.select({ option: jobOptions }).from(jobOptionLinks)
    .innerJoin(jobOptions, eq(jobOptions.id, jobOptionLinks.optionId))
    .where(eq(jobOptionLinks.jobId, job.id))
    .orderBy(asc(jobOptions.group), asc(jobOptions.sortOrder), asc(jobOptions.id));
  return { job, department, brands: links, questions: questions.map(questionFromRow), options: optionLinks.map((row) => row.option) };
}
export function loadPublicJob(slug: string) {
  return unstable_cache(async () => {
    const data = await loadApplicationJob(slug);
    if (!data) return null;
    // Cache only JSON-safe public projections: cached Date instances become strings.
    const { job, department, brands, questions, options } = data;
    return {
      job: { id: job.id, title: job.title, slug: job.slug, summary: job.summary, status: job.status,
        locationText: job.locationText, engagementNote: job.engagementNote,
        salaryMode: job.salaryMode, salaryText: job.salaryText, vacancies: job.vacancies,
        experienceText: job.experienceText, skills: job.skills, benefits: job.benefits,
        niceToHaveMd: job.niceToHaveMd, cvRequired: job.cvRequired,
        deadlineAt: job.deadlineAt?.toISOString() ?? null,
        publishedAt: job.publishedAt?.toISOString() ?? null,
        descriptionMd: job.descriptionMd, responsibilitiesMd: job.responsibilitiesMd, requirementsMd: job.requirementsMd },
      department: { name: department.name, slug: department.slug },
      options: options.filter((option) => option.isActive)
        .map((option) => ({ group: option.group, slug: option.slug, label: option.label })),
      brands: brands.map(({ brand, primary }) => ({ primary, brand: { id: brand.id, name: brand.name, slug: brand.slug,
        status: brand.status, sector: brand.sector, logoUrl: brand.logoUrl, description: brand.description, accentColor: brand.accentColor, website: brand.website } })),
      questions,
    };
  }, ["public-job", slug],
    { tags: ["jobs", "brands", "departments", `job:${slug}`], revalidate: 300 })();
}
