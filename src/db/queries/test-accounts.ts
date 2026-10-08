import "server-only";

import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { requireDevTarget } from "@/db/seed/require-dev";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Only accounts in the browser fixture's reserved namespace. */
const fixtureEmailPattern = "^e2e-[a-f0-9]{32}-admin@example[.]com$";
const protectedOwnerEmail = "hossainnurshakib@gmail.com";

export async function removeOrphanAdmins(): Promise<number> {
  requireDevTarget();
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
    where lower(a.email) <> ${protectedOwnerEmail}
      and (a.email ~ ${fixtureEmailPattern}
        or exists (select 1 from auth.users u where u.id = a.user_id and u.email ~ ${fixtureEmailPattern}))
    returning 1 as removed
  `);
  const client = createSupabaseAdminClient();
  for (const user of users) {
    const { error } = await client.auth.admin.deleteUser(user.id);
    if (error) throw new Error("Test account sweep failed; rerun the guarded sweep.");
  }
  return { adminRowsRemoved: removed.length, authUsersRemoved: users.length };
}
