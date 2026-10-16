import "server-only";

import { eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { applications, brands, departments, jobOptions, jobs } from "@/db/schema";
import { requireDevTarget } from "@/db/seed/require-dev";
import { approvedDemoProject, type DemoOperation } from "@/db/seed/validation-policy";
import { ownsValidationJob, validationJobs } from "@/db/seed/validation-content";
import { demoSlugs } from "@/lib/demo";
import { jobDeletionBlocked } from "@/lib/questions/job-policy";
import { loadJob, saveJob } from "./jobs";

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${key}:${canonical(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

function guard() {
  requireDevTarget();
  if (process.env.DEV_SUPABASE_PROJECT_REF !== approvedDemoProject) throw new Error("Not the owner-authorized demo project.");
}

export async function runValidationDemo(operation: DemoOperation, write: boolean) {
  guard();
  const db = getDb();
  const selected = await db.select().from(jobs).where(inArray(jobs.slug, [...demoSlugs]));
  if (selected.some(row => !ownsValidationJob(row))) throw new Error("Ownership collision: refusing to change any job.");
  const related = selected.length ? await db.select({ jobId: applications.jobId }).from(applications)
    .where(inArray(applications.jobId, selected.map(row => row.id))) : [];
  const report = { project: approvedDemoProject, operation, dryRun: !write, jobs: selected.length, applications: related.length, created: 0, changed: 0, unchanged: 0, blocked: false };
  if (operation === "cleanup") {
    if (related.length) return { ...report, blocked: true };
    if (!write) return report;
    // One transaction: all owned rows and application counts rechecked under the
    // same lifecycle lock as saves/deletes; restrictive FK handles concurrent apply.
    await db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(1103)`);
      const rows = await tx.select().from(jobs).where(inArray(jobs.slug, [...demoSlugs])).for("update");
      if (rows.some(row => !ownsValidationJob(row))) throw new Error("Ownership changed; cleanup refused.");
      if (!rows.length) return;
      const ids = rows.map(row => row.id);
      const refs = await tx.select({ id: applications.id }).from(applications).where(inArray(applications.jobId, ids)).limit(1);
      if (refs.length) throw new Error(jobDeletionBlocked);
      await tx.delete(jobs).where(inArray(jobs.id, ids));
      report.changed = rows.length;
    });
    return report;
  }
  const definitions = validationJobs({
    brands: await db.select().from(brands).where(eq(brands.status, "active")),
    departments: await db.select().from(departments).where(eq(departments.isActive, true)),
    options: await db.select().from(jobOptions).where(eq(jobOptions.isActive, true)),
  });
  if (operation === "publish" && selected.length !== definitions.length) throw new Error("Seed all five drafts before publishing.");
  // Preflight the entire batch before a write so a predictable refusal cannot
  // leave an earlier role published. Concurrent changes still fail closed below.
  if (operation === "publish" && selected.some(row => row.status === "closed")) throw new Error("Closed demo jobs require deliberate admin lifecycle controls.");
  if (selected.some(row => row.status === "draft" && related.some(app => app.jobId === row.id))) throw new Error("Draft demo jobs with applications cannot be modified by this command.");
  for (const definition of definitions) {
    const existing = selected.find(row => row.slug === definition.slug);
    // Published/closed jobs are never edited by seed; publish is separately explicit.
    if (existing && (operation === "seed" && existing.status !== "draft" || operation === "publish" && existing.status === "open")) {
      report.unchanged++;
      continue;
    }
    if (existing && existing.status !== "draft") throw new Error("Closed/published demo jobs are not silently reopened or updated. Use the admin lifecycle controls.");
    if (existing && related.some(row => row.jobId === existing.id)) throw new Error("Demo jobs with applications cannot be reseeded or republished by this command.");
    if (existing && operation === "seed") {
      const loaded = await loadJob(existing.id);
      if (!loaded) throw new Error("Demo job changed during preparation.");
      const current = Object.fromEntries(Object.keys(definition).map(key => [key, loaded.job[key as keyof typeof loaded.job]]));
      Object.assign(current, { id: null, intent: "save", brandIds: loaded.links.map(link => link.brandId).sort(), primaryBrandId: loaded.links.find(link => link.isPrimary)?.brandId,
        optionIds: loaded.options.map(option => option.id).sort(), salaryText: loaded.job.salaryText ?? "", deadlineAt: loaded.job.deadlineAt?.toISOString() ?? null,
        questions: loaded.questions.filter(q => !q.archivedAt).map(({ id, label, type, section, sortOrder, required, helpText, options, config }) => ({ id, label, type, section, sortOrder, required, helpText, options, config })),
      });
      const expected = { ...definition, brandIds: [...definition.brandIds].sort(), optionIds: [...definition.optionIds].sort() };
      if (canonical(current) === canonical(expected)) { report.unchanged++; continue; }
    }
    if (!existing) report.created++; else report.changed++;
    if (write) await saveJob({ ...definition, id: existing?.id ?? null, intent: operation === "publish" ? "publish" : "save" }, existing?.updatedAt);
  }
  return report;
}
