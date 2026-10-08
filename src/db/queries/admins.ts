import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { adminUsers } from "@/db/schema";

export async function findAdmin(userId: string) {
  const [admin] = await getDb()
    .select({ userId: adminUsers.userId })
    .from(adminUsers)
    .where(eq(adminUsers.userId, userId))
    .limit(1);
  return admin ?? null;
}

export async function addAdmin(userId: string, email: string) {
  await getDb()
    .insert(adminUsers)
    .values({ userId, email })
    .onConflictDoUpdate({ target: adminUsers.userId, set: { email } });
}
