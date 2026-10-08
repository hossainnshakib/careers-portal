import "server-only";

import { randomUUID } from "node:crypto";
import { eq, inArray, like } from "drizzle-orm";
import { getDb } from "@/db";
import { adminUsers, applications, brands, departments, jobs } from "@/db/schema";
import { requireDevTarget } from "@/db/seed/require-dev";

/** Only test-created slug prefixes; never clean up arbitrary owner data. */
export async function removeTestFixture(userId: string, prefix: string) {
  requireDevTarget();
  if (!/^e2e-[a-f0-9]{32}-$/.test(prefix)) throw new Error("Invalid test fixture prefix");
  return getDb().transaction(async (tx) => {
    const testJobs = await tx
      .select({ id: jobs.id })
      .from(jobs)
      .where(like(jobs.slug, `${prefix}%`));
    if (testJobs.length)
      await tx.delete(applications).where(
        inArray(
          applications.jobId,
          testJobs.map((job) => job.id),
        ),
      );
    await tx.delete(jobs).where(like(jobs.slug, `${prefix}%`));
    const removedBrands = await tx
      .delete(brands)
      .where(like(brands.slug, `${prefix}%`))
      .returning({ id: brands.id });
    await tx.delete(departments).where(like(departments.slug, `${prefix}%`));
    await tx.delete(adminUsers).where(eq(adminUsers.userId, userId));
    return removedBrands.map((brand) => brand.id);
  });
}

export async function addTestApplication(jobId: string, prefix: string) {
  requireDevTarget();
  if (!/^e2e-[a-f0-9]{32}-$/.test(prefix)) throw new Error("Invalid test prefix");
  const [job] = await getDb().select().from(jobs).where(eq(jobs.id, jobId));
  if (!job?.slug.startsWith(prefix)) throw new Error("Not a test-created job");
  await getDb()
    .insert(applications)
    .values({
      reference: `TEST-${randomUUID()}`,
      jobId,
      fullName: "Test Candidate",
      email: "fixture@example.com",
      phone: "01700000000",
      location: "Dhaka",
      jobTitleSnapshot: job.title,
      jobSlugSnapshot: job.slug,
      departmentNameSnapshot: "Test department",
      brandNamesSnapshot: ["Test brand"],
      primaryBrandSnapshot: "Test brand",
    });
}
