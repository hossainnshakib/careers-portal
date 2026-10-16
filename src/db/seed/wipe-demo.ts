import "server-only";

import { fileURLToPath } from "node:url";
import { closeDb, getDb } from "@/db";
import { applications, attachments, jobs } from "@/db/schema";
import { getStorageClient } from "@/lib/storage/client";
import { requireDevTarget } from "./require-dev";

/**
 * Remove ALL demo content from the pinned dev database: every application
 * (answers, attachments, admin notes, status events) and every job (questions,
 * job-brand links, option links). Departments, brands, job options and admin
 * users are structural and stay. DEV ONLY: requireDevTarget() runs before any
 * database read or storage mutation.
 *
 * Storage files are removed first (like reset.ts), so a storage failure leaves
 * the database untouched. Re-runs are idempotent: an empty bucket and empty
 * tables succeed as a no-op.
 */

async function listApplicationFiles(): Promise<string[]> {
  const bucket = getStorageClient().from("applications");
  const paths: string[] = [];
  async function collect(prefix: string): Promise<void> {
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await bucket.list(prefix, {
        limit: 1000,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error || !data) throw new Error("Storage cleanup failed; demo wipe stopped.");
      for (const object of data) {
        if (!object.name || /[\\/]/.test(object.name) || object.name === "." || object.name === "..")
          throw new Error("Invalid application object entry; demo wipe stopped.");
        if (object.id === null) {
          await collect(`${prefix}/${object.name}`);
          continue;
        }
        paths.push(`${prefix}/${object.name}`);
      }
      if (data.length < 1000) return;
    }
  }
  await collect("applications");
  return paths;
}

export async function wipeDemoData() {
  requireDevTarget(); // Before any database read or storage mutation.
  const db = getDb();
  // Committed files come from the attachments rows plus a full listing of the
  // applications/ prefix, so stray files without a row are collected too.
  const files = new Set(
    (await db.select({ storagePath: attachments.storagePath }).from(attachments)).map((row) => row.storagePath),
  );
  for (const path of await listApplicationFiles()) files.add(path);
  const paths = [...files];
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await getStorageClient().from("applications").remove(paths.slice(i, i + 100));
    if (error) throw new Error("Storage cleanup failed; demo wipe stopped.");
  }
  return db.transaction(async (tx) => {
    const removedApplications = await tx.delete(applications).returning({ id: applications.id });
    const removedJobs = await tx.delete(jobs).returning({ id: jobs.id });
    return {
      applications: removedApplications.length,
      jobs: removedJobs.length,
      files: files.size,
    };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  wipeDemoData()
    .then(
      (summary) =>
        console.info(
          `Demo wipe removed ${summary.jobs} jobs, ${summary.applications} applications and ${summary.files} storage files. Departments, brands and options are untouched.`,
        ),
      () => {
        console.error(
          "Demo wipe failed or was refused. Check APP_ENV, the pinned dev project, and connection settings.",
        );
        process.exitCode = 1;
      },
    )
    .finally(closeDb);
