import "server-only";

import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { departments, jobs } from "@/db/schema";
import type { DepartmentInput } from "@/lib/validation/departments";

export async function listDepartments() {
  return getDb()
    .select()
    .from(departments)
    .orderBy(asc(departments.sortOrder), asc(departments.id));
}

export async function saveDepartment(input: DepartmentInput) {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(1101)`);
    const { id, ...values } = input;
    if (id) {
      const [row] = await tx
        .update(departments)
        .set(values)
        .where(eq(departments.id, id))
        .returning({ id: departments.id });
      if (!row) throw new Error("Department not found");
      return row;
    }
    const rows = await tx.select({ order: departments.sortOrder }).from(departments);
    const [row] = await tx
      .insert(departments)
      .values({ ...values, sortOrder: Math.max(0, ...rows.map((row) => row.order)) + 1 })
      .returning({ id: departments.id });
    return row;
  });
}

export async function reorderDepartment(id: string, direction: "up" | "down") {
  await getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(1101)`);
    const rows = await tx
      .select({ id: departments.id })
      .from(departments)
      .orderBy(asc(departments.sortOrder), asc(departments.id))
      .for("update");
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) throw new Error("Department not found");
    const next = index + (direction === "up" ? -1 : 1);
    if (next < 0 || next >= rows.length) return;
    [rows[index], rows[next]] = [rows[next], rows[index]];
    for (const [order, row] of rows.entries())
      await tx
        .update(departments)
        .set({ sortOrder: order + 1 })
        .where(eq(departments.id, row.id));
  });
}

export async function departmentJobSlugs(id: string) {
  return getDb().select({ slug: jobs.slug }).from(jobs).where(eq(jobs.departmentId, id));
}
