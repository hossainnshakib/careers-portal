import "server-only";

import { count } from "drizzle-orm";
import { getDb } from "@/db";
import { applications, brands, departments, jobQuestions, jobs } from "@/db/schema";

export async function getRowCounts() {
  const db = getDb();
  const totals: Record<string, number> = {};
  for (const [name, table] of Object.entries({
    departments,
    brands,
    jobs,
    questions: jobQuestions,
    applications,
  })) {
    const [result] = await db.select({ count: count() }).from(table);
    totals[name] = result.count;
  }
  return totals;
}
