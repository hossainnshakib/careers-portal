import "server-only";

import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { brands } from "@/db/schema";

export async function listActiveBrands() {
  return getDb()
    .select()
    .from(brands)
    .where(eq(brands.status, "active"))
    .orderBy(asc(brands.sortOrder));
}
