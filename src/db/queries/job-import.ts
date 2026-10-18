import "server-only";
import { getDb } from "@/db";
import { brands, departments, jobOptions, jobs } from "@/db/schema";
import type { ImportCatalog } from "@/lib/jobs/import";

/** Bounded catalog-only projections: never read applicants, credentials or answers. */
export async function loadImportCatalog(): Promise<ImportCatalog> {
  const db = getDb();
  const departmentRows = await db.select({ id: departments.id, slug: departments.slug, isActive: departments.isActive }).from(departments);
  const brandRows = await db.select({ id: brands.id, slug: brands.slug, status: brands.status }).from(brands);
  const optionRows = await db.select({ id: jobOptions.id, slug: jobOptions.slug, group: jobOptions.group, isActive: jobOptions.isActive }).from(jobOptions);
  const identities = await db.select({ title: jobs.title, slug: jobs.slug }).from(jobs);
  return { departments: departmentRows, brands: brandRows, options: optionRows, jobs: identities };
}
