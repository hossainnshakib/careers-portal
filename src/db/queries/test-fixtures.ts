import "server-only";

import { randomUUID } from "node:crypto";
import { eq, inArray, like } from "drizzle-orm";
import { getDb } from "@/db";
import { adminUsers, applications, brands, departments, jobOptions, jobs } from "@/db/schema";
import { requireDevTarget } from "@/db/seed/require-dev";

export function ownsFixtureCandidate(prefix: string, row: { email: string; fullName: string }) {
  if (!/^e2e-[a-f0-9]{32}-$/.test(prefix)) return false;
  const email = row.email.toLowerCase();
  return email.startsWith(prefix) && email.endsWith("@example.com") ||
    row.email === "fixture@example.com" && row.fullName === "Test Candidate" ||
    row.email === "public-fixture@example.com" && row.fullName === "শ্রী ক্ষিতিশ";
}

/** Only test-created slug prefixes; never clean up arbitrary owner data. */
export async function removeTestFixture(userId: string, prefix: string) {
  requireDevTarget();
  if (!/^e2e-[a-f0-9]{32}-$/.test(prefix)) throw new Error("Invalid test fixture prefix");
  return getDb().transaction(async (tx) => {
    const testJobs = await tx
      .select({ id: jobs.id })
      .from(jobs)
      .where(like(jobs.slug, `${prefix}%`));
    if (testJobs.length) {
      const candidates = await tx.select({ id: applications.id, email: applications.email, fullName: applications.fullName })
        .from(applications).where(inArray(applications.jobId, testJobs.map(job => job.id))).for("update");
      // A public transient test job could receive an unexpected application.
      // Never infer candidate ownership from the job prefix alone.
      if (candidates.some(row => !ownsFixtureCandidate(prefix, row))) throw new Error("Unexpected application on test job; refuse cleanup and request owner review.");
      if (candidates.length) await tx.delete(applications).where(inArray(applications.id, candidates.map(row => row.id)));
    }
    await tx.delete(jobs).where(like(jobs.slug, `${prefix}%`));
    await tx.delete(jobOptions).where(like(jobOptions.slug, `${prefix}%`));
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
