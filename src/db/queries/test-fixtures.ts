import "server-only";

import { eq, like } from "drizzle-orm";
import { getDb } from "@/db";
import { adminUsers, brands, departments, jobs } from "@/db/schema";
import { requireDevTarget } from "@/db/seed/require-dev";

/** Only test-created slug prefixes; never clean up arbitrary owner data. */
export async function removeTestFixture(userId: string, prefix: string) {
  requireDevTarget();
  if (!/^e2e-[a-f0-9]{32}-$/.test(prefix)) throw new Error("Invalid test fixture prefix");
  await getDb().transaction(async (tx) => {
    await tx.delete(jobs).where(like(jobs.slug, `${prefix}%`));
    await tx.delete(brands).where(like(brands.slug, `${prefix}%`));
    await tx.delete(departments).where(like(departments.slug, `${prefix}%`));
    await tx.delete(adminUsers).where(eq(adminUsers.userId, userId));
  });
}
