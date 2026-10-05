import "server-only";

import { randomUUID } from "node:crypto";
import { closeDb } from "../../src/db/index";
import { addAdmin } from "../../src/db/queries/admins";
import { removeTestFixture } from "../../src/db/queries/test-fixtures";
import { requireDevTarget } from "../../src/db/seed/require-dev";
import { createSupabaseAdminClient } from "../../src/lib/supabase/admin";
import { removeTestLogos } from "../../src/lib/storage/test-logos";

let userId: string | undefined;
const prefix = `e2e-${randomUUID().replaceAll("-", "")}-`;
let cleaning = false;
async function cleanup() {
  if (cleaning) return;
  cleaning = true;
  try {
    if (userId) {
      try {
        const brands = await removeTestFixture(userId, prefix);
        await removeTestLogos(brands);
      } finally {
        const { error } = await createSupabaseAdminClient().auth.admin.deleteUser(userId);
        if (error) throw new Error("Auth cleanup failed");
      }
    }
    process.send?.({ type: "cleaned" });
  } catch {
    process.send?.({ type: "error", message: "Test fixture cleanup failed." });
  } finally {
    await closeDb();
    process.exit();
  }
}
process.on("message", (message) => {
  if (message === "cleanup") void cleanup();
});
process.on("disconnect", () => {
  void cleanup();
});

async function setup() {
  requireDevTarget();
  const email = `${prefix}admin@example.com`;
  const password = `${randomUUID()}Aa9!`;
  const { data, error } = await createSupabaseAdminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error("Test account creation failed");
  userId = data.user.id;
  await addAdmin(userId, email);
  // Credentials travel only over IPC to the fixture, never stdout or files.
  process.send?.({ type: "ready", email, password, prefix });
}
setup().catch(async () => {
  process.send?.({ type: "error", message: "Guarded test fixture setup failed." });
  await cleanup();
});
