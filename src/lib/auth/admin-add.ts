import "server-only";

import { fileURLToPath } from "node:url";
import { z } from "zod";
import { closeDb } from "@/db";
import { addAdmin } from "@/db/queries/admins";
import { requireDevTarget } from "@/db/seed/require-dev";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function allowlistExistingAdmin(emailInput: unknown) {
  requireDevTarget();
  const email = z.email().max(254).parse(emailInput).toLowerCase();
  const supabase = createSupabaseAdminClient();
  // Auth has no lookup-by-email API. Traverse every page rather than assume
  // the desired account is in the first 50 users.
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error("Unable to look up Auth user.");
    const user = data.users.find((user) => user.email?.toLowerCase() === email);
    if (user) {
      await addAdmin(user.id, email);
      return;
    }
    if (data.users.length < 100)
      throw new Error("Create the Auth user in the dev dashboard first.");
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  allowlistExistingAdmin(process.argv.length === 3 ? process.argv[2] : undefined)
    .then(
      () => console.info("Existing Auth user added to the development admin allowlist."),
      () => {
        console.error(
          "Admin add failed. Verify the dev target, existing Auth user and email argument.",
        );
        process.exitCode = 1;
      },
    )
    .finally(closeDb);
}
