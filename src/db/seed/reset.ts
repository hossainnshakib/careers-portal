import "server-only";

import postgres from "postgres";
import { getServerEnv } from "@/lib/env";
import { getStorageClient } from "@/lib/storage/client";
import { runMigrations } from "@/db/migrate";
import { closeDb } from "@/db";
import { requireDevTarget } from "./require-dev";
import { seedDemo } from "./demo";

async function resetDev() {
  requireDevTarget(); // Validate BOTH DB URLs before opening any connection.
  const client = postgres(getServerEnv().DIRECT_URL, { prepare: false, max: 1 });
  try {
    const exists = await client`select to_regclass('public.attachments') as name`;
    if (exists[0].name) {
      const files = await client<
        { storage_path: string }[]
      >`select storage_path from public.attachments`;
      for (let i = 0; i < files.length; i += 100) {
        const { error } = await getStorageClient()
          .from("applications")
          .remove(files.slice(i, i + 100).map((file) => file.storage_path));
        if (error) throw new Error("Storage cleanup failed; database reset stopped.");
      }
    }
    await client.begin(async (tx) => {
      await tx.unsafe(
        `DROP TABLE IF EXISTS application_status_events, admin_notes, application_answers, attachments, applications, job_questions, job_brands, jobs, brands, departments, admin_users CASCADE`,
      );
      await tx.unsafe(
        `DROP TYPE IF EXISTS sector, employment_type, work_mode, experience_level, job_status, brand_status, question_type, question_section, application_status, attachment_kind CASCADE`,
      );
      await tx.unsafe(`DROP FUNCTION IF EXISTS public.jobs_slug_immutable() CASCADE`);
      await tx.unsafe(`DROP TABLE IF EXISTS drizzle.__drizzle_migrations`);
    });
  } finally {
    await client.end();
  }
  await runMigrations();
  await seedDemo();
}

resetDev()
  .then(
    () => console.info("Dev reset completed."),
    () => {
      console.error(
        "Dev reset failed or was refused. Check the pinned dev project and configuration.",
      );
      process.exitCode = 1;
    },
  )
  .finally(closeDb);
