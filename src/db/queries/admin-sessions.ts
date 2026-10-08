import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { adminSessionLifetimeSeconds } from "@/lib/auth/session-cookies";

/** Read existing provider session metadata, never store/copy an access token. */
export async function hasCurrentAdminSession(sessionId: string, userId: string): Promise<boolean> {
  const rows = await getDb().execute(sql`
    select 1 from auth.sessions
    where id = ${sessionId}::uuid and user_id = ${userId}::uuid
      and created_at > now() - (${adminSessionLifetimeSeconds} * interval '1 second')
      and (not_after is null or not_after > now())
    limit 1
  `);
  return rows.length === 1;
}
