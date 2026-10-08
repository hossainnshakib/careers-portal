import "server-only";
import { and, asc, desc, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { getDb } from "@/db";
import { brands, departments, jobBrands, jobs } from "@/db/schema";

/** Public catalog fields only; no Next cache dependency in this Node CLI. */
export async function listPosterJobs() {
  const db = getDb();
  const rows = await db.select({ id: jobs.id, title: jobs.title, slug: jobs.slug, department: departments.name })
    .from(jobs).innerJoin(departments, eq(departments.id, jobs.departmentId))
    .where(and(eq(jobs.status, "open"), or(isNull(jobs.deadlineAt), gt(jobs.deadlineAt, new Date()))))
    .orderBy(asc(jobs.sortOrder), asc(jobs.title));
  if (!rows.length) return [];
  const links = await db.select({ jobId: jobBrands.jobId, slug: brands.slug }).from(jobBrands)
    .innerJoin(brands, eq(brands.id, jobBrands.brandId))
    .where(and(inArray(jobBrands.jobId, rows.map(row => row.id)), eq(brands.status, "active")))
    .orderBy(desc(jobBrands.isPrimary), asc(brands.sortOrder));
  return rows.flatMap(row => {
    const slugs = links.filter(link => link.jobId === row.id).map(link => link.slug);
    return slugs.length ? [{ title: row.title, slug: row.slug, department: row.department, brands: slugs }] : [];
  });
}
