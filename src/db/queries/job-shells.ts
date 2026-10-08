import "server-only";
import { getDb } from "@/db";
import { departments, jobs } from "@/db/schema";
import { buildJobShells } from "@/db/seed/shell-values";
import { requireAllowedTarget } from "@/lib/maintenance/require-target";

export async function seedJobShells() {
  requireAllowedTarget();
  return getDb().transaction(async tx => {
    const values = buildJobShells(await tx.select({ id: departments.id, slug: departments.slug }).from(departments));
    const inserted = await tx.insert(jobs).values(values).onConflictDoNothing({ target: jobs.slug }).returning({ id: jobs.id });
    return { created: inserted.length, preserved: values.length - inserted.length };
  });
}
