import "server-only";

import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { requireDevTarget } from "@/db/seed/require-dev";
import { approvedDemoProject } from "@/db/seed/validation-policy";
import type { ApplicationTransaction } from "./applications";

export type CleanupRecord = Record<string, unknown>;
export type CleanupInventory = {
  tables: Record<string, CleanupRecord[]>;
  applicationCounts: Record<string, number>;
  structure: Record<string, { count: number; hash: string }>;
  objects: CleanupRecord[];
};
export function cleanupInventoryHash(inventory: CleanupInventory) {
  return createHash("sha256").update(JSON.stringify(inventory)).digest("hex");
}

/** Private external backup input only: never send this snapshot to a public route or log it. */
export async function loadDemoCleanupInventory(transaction?: ApplicationTransaction): Promise<CleanupInventory> {
  requireDevTarget();
  if (process.env.DEV_SUPABASE_PROJECT_REF !== approvedDemoProject) throw new Error("Unapproved cleanup target.");
  const load = async (tx: ApplicationTransaction) => {
    const tables: CleanupInventory["tables"] = {};
    for (const table of ["jobs", "job_brands", "job_option_links", "job_questions"] as const) {
      const rows = await tx.execute<{ record: CleanupRecord }>(sql`select to_jsonb(t) as record from public.${sql.identifier(table)} t order by to_jsonb(t)::text`);
      tables[table] = rows.map(row => row.record);
    }
    const applicationCounts: CleanupInventory["applicationCounts"] = {};
    for (const table of ["applications", "application_answers", "attachments", "admin_notes", "application_status_events"] as const) {
      const [row] = await tx.execute<{ count: number }>(sql`select count(*)::int as count from public.${sql.identifier(table)}`);
      applicationCounts[table] = row.count;
    }
    const structure: CleanupInventory["structure"] = {};
    for (const table of ["departments", "brands", "job_options", "admin_users"] as const) {
      const [row] = await tx.execute<{ count: number; hash: string }>(sql`select count(*)::int as count, md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' order by to_jsonb(t)::text), '')) as hash from public.${sql.identifier(table)} t`);
      structure[table] = row;
    }
    const objects = await tx.execute<CleanupRecord>(sql`select id, bucket_id, name, metadata, created_at, updated_at from storage.objects order by bucket_id, name`);
    return { tables, applicationCounts, structure, objects: [...objects] };
  };
  if (transaction) return load(transaction);
  return getDb().transaction(async tx => { await tx.execute(sql`set transaction read only`); return load(tx); });
}
