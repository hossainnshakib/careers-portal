import "server-only";

import { asc, count, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { jobOptionLinks, jobOptions } from "@/db/schema";
import type { OptionGroup } from "@/lib/careers/option-labels";
import type { OptionInput } from "@/lib/validation/options";

export type OptionRow = typeof jobOptions.$inferSelect;

/** Every option in group order then sort order, exactly as stored. */
export async function listJobOptions(group?: OptionGroup) {
  return getDb()
    .select()
    .from(jobOptions)
    .where(group ? eq(jobOptions.group, group) : undefined)
    .orderBy(asc(jobOptions.group), asc(jobOptions.sortOrder), asc(jobOptions.id));
}

/** Link counts across every job (any status): linked options cannot be deleted. */
export async function optionLinkCounts() {
  const rows = await getDb()
    .select({ optionId: jobOptionLinks.optionId, links: count() })
    .from(jobOptionLinks)
    .groupBy(jobOptionLinks.optionId);
  return new Map(rows.map((row) => [row.optionId, row.links]));
}

export async function saveOption(input: OptionInput) {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(1104)`);
    const { id, ...values } = input;
    if (id) {
      const [row] = await tx
        .update(jobOptions)
        .set(values)
        .where(eq(jobOptions.id, id))
        .returning({ id: jobOptions.id });
      if (!row) throw new Error("Option not found");
      return row;
    }
    const rows = await tx
      .select({ order: jobOptions.sortOrder })
      .from(jobOptions)
      .where(eq(jobOptions.group, values.group));
    const [row] = await tx
      .insert(jobOptions)
      .values({ ...values, sortOrder: Math.max(0, ...rows.map((r) => r.order)) + 1 })
      .returning({ id: jobOptions.id });
    return row;
  });
}

/** Reorder within the option's own group only. */
export async function reorderOption(id: string, direction: "up" | "down") {
  await getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(1104)`);
    const [target] = await tx
      .select({ group: jobOptions.group })
      .from(jobOptions)
      .where(eq(jobOptions.id, id))
      .for("update");
    if (!target) throw new Error("Option not found");
    const rows = await tx
      .select({ id: jobOptions.id })
      .from(jobOptions)
      .where(eq(jobOptions.group, target.group))
      .orderBy(asc(jobOptions.sortOrder), asc(jobOptions.id))
      .for("update");
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) throw new Error("Option not found");
    const next = index + (direction === "up" ? -1 : 1);
    if (next < 0 || next >= rows.length) return;
    [rows[index], rows[next]] = [rows[next], rows[index]];
    for (const [order, row] of rows.entries())
      await tx.update(jobOptions).set({ sortOrder: order + 1 }).where(eq(jobOptions.id, row.id));
  });
}

/** Deletion is only allowed while no job links the option; otherwise deactivate. */
export async function deleteOption(id: string) {
  await getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(1104)`);
    const [links] = await tx
      .select({ links: count() })
      .from(jobOptionLinks)
      .where(eq(jobOptionLinks.optionId, id));
    if (!links || links.links > 0) throw new Error("Option is used by jobs");
    const deleted = await tx
      .delete(jobOptions)
      .where(eq(jobOptions.id, id))
      .returning({ id: jobOptions.id });
    if (!deleted.length) throw new Error("Option not found");
  });
}

/** One bounded lookup: every job's linked options, active or not. */
export async function jobOptionsFor(jobIds: string[]) {
  if (!jobIds.length) return new Map<string, OptionRow[]>();
  const rows = await getDb()
    .select({ jobId: jobOptionLinks.jobId, option: jobOptions })
    .from(jobOptionLinks)
    .innerJoin(jobOptions, eq(jobOptions.id, jobOptionLinks.optionId))
    .where(inArray(jobOptionLinks.jobId, jobIds))
    .orderBy(asc(jobOptions.group), asc(jobOptions.sortOrder), asc(jobOptions.id));
  const grouped = new Map<string, OptionRow[]>();
  for (const row of rows) {
    const list = grouped.get(row.jobId) ?? [];
    list.push(row.option);
    grouped.set(row.jobId, list);
  }
  return grouped;
}
