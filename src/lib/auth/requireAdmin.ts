import "server-only";

import { findAdmin } from "@/db/queries/admins";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export class AdminAccessError extends Error {
  constructor() {
    super("Administrator access required.");
    this.name = "AdminAccessError";
  }
}
export class AdminMfaRequiredError extends AdminAccessError {
  constructor() { super(); this.name = "AdminMfaRequiredError"; }
}

/** Call directly in every protected page, action and route, before reading inputs/data. */
export async function requireAdmin(options?: { allowMfaSetup: true }): Promise<{ userId: string; email: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser().catch(() => { throw new Error("Unable to verify administrator identity."); });
  if (error || !data.user?.email) throw new AdminAccessError();
  const allowed = await findAdmin(data.user.id).catch(() => { throw new Error("Unable to verify administrator access."); });
  if (!allowed) throw new AdminAccessError();
  if (!options?.allowMfaSetup) {
    // getClaims verifies the JWT signature/expiry; do not authorize from the
    // SDK's session-derived getAuthenticatorAssuranceLevel() metadata.
    const claims = await supabase.auth.getClaims().catch(() => { throw new Error("Unable to verify administrator security."); });
    if (claims.error || !claims.data || claims.data.claims.sub !== data.user.id) throw new AdminAccessError();
    if (claims.data.claims.aal !== "aal2") throw new AdminMfaRequiredError();
  }
  return { userId: data.user.id, email: data.user.email };
}
