import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";
import { eq, sql } from "drizzle-orm";

vi.mock("server-only", () => ({}));
import { closeDb, getDb } from "@/db";
import { adminUsers } from "@/db/schema";
import { requireDevTarget } from "@/db/seed/require-dev";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sweepTestAccounts } from "./test-accounts";

describe.skipIf(process.env.RUN_SUPABASE_TESTS !== "1")("dev crashed browser account recovery", () => {
  afterAll(closeDb);
  it("removes live and orphaned fixture accounts while preserving other allowlist rows", async () => {
    requireDevTarget();
    const db = getDb();
    const retained = await db.execute<{ user_id: string }>(sql`
      select user_id from admin_users where email !~ '^e2e-[a-f0-9]{32}-admin@example[.]com$' order by user_id
    `);
    const email = `e2e-${randomUUID().replaceAll("-", "")}-admin@example.com`;
    const orphanEmail = `e2e-${randomUUID().replaceAll("-", "")}-admin@example.com`;
    const orphanId = randomUUID();
    const client = createSupabaseAdminClient();
    const created = await client.auth.admin.createUser({ email, password: `${randomUUID()}Aa9!`, email_confirm: true });
    if (created.error || !created.data.user) throw new Error("Synthetic account creation failed.");
    const userId = created.data.user.id;
    try {
      await db.insert(adminUsers).values([{ userId, email }, { userId: orphanId, email: orphanEmail }]);
      const counts = await sweepTestAccounts();
      expect(counts.authUsersRemoved).toBeGreaterThanOrEqual(1);
      expect(counts.adminRowsRemoved).toBeGreaterThanOrEqual(2);
      expect((await db.select({ id: adminUsers.userId }).from(adminUsers).where(eq(adminUsers.userId, userId))).length).toBe(0);
      expect((await db.select({ id: adminUsers.userId }).from(adminUsers).where(eq(adminUsers.userId, orphanId))).length).toBe(0);
      expect((await client.auth.admin.getUserById(userId)).data.user === null).toBe(true);
      const remaining = await db.execute<{ user_id: string }>(sql`
        select user_id from admin_users where email !~ '^e2e-[a-f0-9]{32}-admin@example[.]com$' order by user_id
      `);
      // Boolean assertion prevents allowlist identities from appearing in a failure diff.
      expect(JSON.stringify(retained) === JSON.stringify(remaining)).toBe(true);
    } finally {
      await db.delete(adminUsers).where(eq(adminUsers.userId, orphanId));
      await db.delete(adminUsers).where(eq(adminUsers.userId, userId));
      await client.auth.admin.deleteUser(userId);
    }
  }, 120_000);
});
