import "server-only";

import { and, asc, eq, gt, isNull, ne, or } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getDb } from "@/db";
import { brands, departments, jobBrands, jobQuestions, jobs } from "@/db/schema";
import { questionFromRow } from "@/lib/questions/from-row";
import type { JobCard, PublicBrand } from "@/lib/careers/filters";

export const loadPublicCatalog = cache(unstable_cache(async () => {
  const db = getDb();
  // The public layout and home share this request-local memoized read. Keep
  // its bounded statements sequential on the same pooler as admin read sets.
  const rows = await db.select().from(jobs).where(and(eq(jobs.status, "open"), or(isNull(jobs.deadlineAt), gt(jobs.deadlineAt, new Date())))).orderBy(asc(jobs.sortOrder), asc(jobs.title));
  const brandRows = await db.select().from(brands).where(eq(brands.status, "active")).orderBy(asc(brands.sortOrder));
  const departmentRows = await db.select().from(departments).orderBy(asc(departments.sortOrder));
  const links = await db.select().from(jobBrands);
  const publicBrands: PublicBrand[] = brandRows.map(({ id, name, slug, sector, logoUrl, description, accentColor, website }) =>
    ({ id, name, slug, sector, logoUrl, description, accentColor, website }));
  const cards: JobCard[] = rows.flatMap((job) => {
    const department = departmentRows.find((d) => d.id === job.departmentId);
    const linked = links.filter((l) => l.jobId === job.id);
    const visible = publicBrands.filter((b) => linked.some((l) => l.brandId === b.id));
    if (!department || !visible.length) return [];
    return [{ id: job.id, title: job.title, slug: job.slug, summary: job.summary,
      employmentType: job.employmentType, workMode: job.workMode, experienceLevel: job.experienceLevel,
      locationText: job.locationText, department: { name: department.name, slug: department.slug },
      brands: visible, primaryBrandId: linked.find((l) => l.isPrimary)?.brandId ?? visible[0].id }];
  });
  return { jobs: cards, brands: publicBrands, departments: departmentRows.map(({ name, slug }) => ({ name, slug })) };
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
  return { job, department, brands: links, questions: questions.map(questionFromRow) };
}
export function loadPublicJob(slug: string) {
  return unstable_cache(async () => {
    const data = await loadApplicationJob(slug);
    if (!data) return null;
    // Cache only JSON-safe public projections: cached Date instances become strings.
    const { job, department, brands, questions } = data;
    return {
      job: { id: job.id, title: job.title, slug: job.slug, summary: job.summary, status: job.status,
        employmentType: job.employmentType, workMode: job.workMode, experienceLevel: job.experienceLevel,
        locationText: job.locationText, deadlineAt: job.deadlineAt?.toISOString() ?? null,
        descriptionMd: job.descriptionMd, responsibilitiesMd: job.responsibilitiesMd, requirementsMd: job.requirementsMd },
      department: { name: department.name, slug: department.slug },
      brands: brands.map(({ brand, primary }) => ({ primary, brand: { id: brand.id, name: brand.name, slug: brand.slug,
        status: brand.status, sector: brand.sector, logoUrl: brand.logoUrl, description: brand.description, accentColor: brand.accentColor } })),
      questions,
    };
  }, ["public-job", slug],
    { tags: ["jobs", "brands", "departments", `job:${slug}`], revalidate: 300 })();
}
