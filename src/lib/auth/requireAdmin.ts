import "server-only";

import { findAdmin } from "@/db/queries/admins";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export class AdminAccessError extends Error {
  constructor() {
    super("Administrator access required.");
    this.name = "AdminAccessError";
  }
}

/** Call directly in every protected page, action and route, before reading inputs/data. */
export async function requireAdmin(): Promise<{ userId: string; email: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) throw new AdminAccessError();
  if (!(await findAdmin(data.user.id))) throw new AdminAccessError();
  return { userId: data.user.id, email: data.user.email };
}
