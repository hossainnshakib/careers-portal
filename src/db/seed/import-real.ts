import "server-only";

import { fileURLToPath } from "node:url";
import { and, asc, eq, isNull } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import {
  brands,
  departments,
  jobOptions,
  jobQuestions,
  jobs,
} from "@/db/schema";
import { saveJob } from "@/db/queries/jobs";
import { requireDevTarget } from "./require-dev";
import { realJobs, realJobToInput, type ExistingQuestion } from "./real-content";

/**
 * Apply the owner-provided real job content to the pinned dev database.
 *
 * Every job is updated through `saveJob` (the admin save path): full `jobInput`
 * validation, brands/options replaced transactionally, removed questions
 * archived when applications exist, publish rules enforced. Existing open /
 * draft / closed statuses are preserved because the import saves with
 * `intent: "save"`. Runs are idempotent: question IDs are reused by label+type.
 */
export async function importRealContent() {
  requireDevTarget(); // Before any database read or write.
  const db = getDb();
  const allDepartments = await db.select().from(departments);
  const allBrands = await db.select().from(brands).orderBy(asc(brands.sortOrder));
  const allOptions = await db
    .select()
    .from(jobOptions)
    .orderBy(asc(jobOptions.group), asc(jobOptions.sortOrder), asc(jobOptions.id));

  const summary: Array<{ slug: string; status: string; questions: number }> = [];
  for (const raw of realJobs) {    const department = allDepartments.find((item) => item.slug === raw.department_slug);
    if (!department)
      throw new Error(`Unknown department slug ${raw.department_slug} (job ${raw.slug}).`);
    const brandIds = raw.brands.map((slug) => {
      const brand = allBrands.find((item) => item.slug === slug);
      if (!brand) throw new Error(`Unknown brand slug ${slug} (job ${raw.slug}).`);
      return brand.id;
    });
    const optionIds: string[] = [];
    for (const [group, slugs] of Object.entries(raw.options)) {
      for (const slug of slugs) {
        const option = allOptions.find(
          (item) => item.group === group && item.slug === slug,
        );
        if (!option)
          throw new Error(`Unknown option ${group}/${slug} (job ${raw.slug}).`);
        optionIds.push(option.id);
      }
    }
    const [job] = await db.select().from(jobs).where(eq(jobs.slug, raw.slug));
    if (!job)
      throw new Error(
        `No dev job with slug ${raw.slug}. Seed the 19 shells first (pnpm seed:demo).`,
      );
    const questionRows = await db
      .select()
      .from(jobQuestions)
      .where(and(eq(jobQuestions.jobId, job.id), isNull(jobQuestions.archivedAt)));
    const existingQuestions: ExistingQuestion[] = questionRows.map((row) => ({
      id: row.id,
      label: row.label,
      type: row.type,
      archivedAt: row.archivedAt,
    }));
    const input = realJobToInput(raw, {
      jobId: job.id,
      departmentId: department.id,
      brandIds,
      optionIds,
      locationText: job.locationText,
      existingQuestions,
    });
    const saved = await saveJob(input);
    const [after] = await db.select({ status: jobs.status }).from(jobs).where(eq(jobs.id, saved.id));
    summary.push({ slug: saved.slug, status: after?.status ?? "unknown", questions: input.questions.length });
  }
  return summary;
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  importRealContent()
    .then(
      (rows) => {
        for (const row of rows)
          console.info(`Imported ${row.slug} (${row.questions} questions).`);
        console.info(`Real content applied to ${rows.length} dev jobs.`);
      },
      (error: unknown) => {
        console.error(
          "Real-content import refused or failed:",
          error instanceof Error ? error.message : error,
        );
        process.exitCode = 1;
      },
    )
    .finally(closeDb);
