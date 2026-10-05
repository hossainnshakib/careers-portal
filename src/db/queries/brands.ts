import "server-only";

import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { brands, jobBrands, jobs } from "@/db/schema";
import type { BrandInput } from "@/lib/validation/brands";

export async function listActiveBrands() {
  return getDb()
    .select()
    .from(brands)
    .where(eq(brands.status, "active"))
    .orderBy(asc(brands.sortOrder));
}

export async function listBrands() {
  return getDb().select().from(brands).orderBy(asc(brands.sortOrder), asc(brands.id));
}

export async function findBrand(id: string) {
  const [row] = await getDb().select().from(brands).where(eq(brands.id, id)).limit(1);
  return row ?? null;
}

export async function saveBrand(input: BrandInput) {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(1102)`);
    const { id, website, accentColor, ...fields } = input;
    const values = { ...fields, website: website || null, accentColor: accentColor || null };
    if (id) {
      const [row] = await tx
        .update(brands)
        .set(values)
        .where(eq(brands.id, id))
        .returning({ id: brands.id });
      if (!row) throw new Error("Brand not found");
      return row;
    }
    const rows = await tx.select({ order: brands.sortOrder }).from(brands);
    const [row] = await tx
      .insert(brands)
      .values({ ...values, sortOrder: Math.max(0, ...rows.map((row) => row.order)) + 1 })
      .returning({ id: brands.id });
    return row;
  });
}

export async function reorderBrand(id: string, direction: "up" | "down") {
  await getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(1102)`);
    const rows = await tx
      .select({ id: brands.id })
      .from(brands)
      .orderBy(asc(brands.sortOrder), asc(brands.id))
      .for("update");
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) throw new Error("Brand not found");
    const next = index + (direction === "up" ? -1 : 1);
    if (next < 0 || next >= rows.length) return;
    [rows[index], rows[next]] = [rows[next], rows[index]];
    for (const [order, row] of rows.entries())
      await tx
        .update(brands)
        .set({ sortOrder: order + 1 })
        .where(eq(brands.id, row.id));
  });
}

export async function setBrandLogo(id: string, logoUrl: string) {
  const [row] = await getDb()
    .update(brands)
    .set({ logoUrl })
    .where(eq(brands.id, id))
    .returning({ id: brands.id });
  if (!row) throw new Error("Brand not found");
}

export async function brandJobSlugs(id: string) {
  return getDb()
    .select({ slug: jobs.slug })
    .from(jobBrands)
    .innerJoin(jobs, eq(jobs.id, jobBrands.jobId))
    .where(eq(jobBrands.brandId, id));
}
