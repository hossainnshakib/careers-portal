import "server-only";

import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { requireDevTarget } from "@/db/seed/require-dev";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Only accounts in the browser fixture's reserved namespace. */
const fixtureEmailPattern = "^e2e-[a-f0-9]{32}-admin@example[.]com$";
export async function removeOrphanAdmins(protectedEmail: string): Promise<number> {
  requireDevTarget();
  const protectedOwnerEmail = z.email().parse(protectedEmail).toLowerCase();
  const removed = await getDb().execute(sql`
    delete from public.admin_users a
    where not exists (select 1 from auth.users u where u.id = a.user_id)
      and lower(a.email) <> ${protectedOwnerEmail}
    returning 1 as removed
  `);
  return removed.length;
}

/** Run only before/after a serialized browser suite, never beside active fixtures. */
export async function sweepTestAccounts() {
  requireDevTarget();
  const users = await getDb().execute<{ id: string }>(sql`
    select id from auth.users where email ~ ${fixtureEmailPattern}
  `);
  const removed = await getDb().execute(sql`
    delete from public.admin_users a
    where a.email ~ ${fixtureEmailPattern}
    returning 1 as removed
  `);
  const client = createSupabaseAdminClient();
  for (const user of users) {
    const { error } = await client.auth.admin.deleteUser(user.id);
    if (error) throw new Error("Test account sweep failed; rerun the guarded sweep.");
  }
  return { adminRowsRemoved: removed.length, authUsersRemoved: users.length };
}
