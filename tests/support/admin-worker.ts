import "server-only";

import { randomUUID } from "node:crypto";
import { closeDb } from "../../src/db/index";
import { addAdmin } from "../../src/db/queries/admins";
import { removeTestFixture } from "../../src/db/queries/test-fixtures";
import { requireDevTarget } from "../../src/db/seed/require-dev";
import { createSupabaseAdminClient } from "../../src/lib/supabase/admin";
import { removeTestLogos } from "../../src/lib/storage/test-logos";
import { createServerClient } from "@supabase/ssr";
import { getPublicEnv } from "../../src/lib/env-public";
import { createPublicTestJob, verifyPublicTestApplication } from "../../src/db/queries/public-test-fixture";
import { removePublicTestFiles } from "../../src/lib/storage/public-test-files";

let userId: string | undefined;
const prefix = `e2e-${randomUUID().replaceAll("-", "")}-`;
let cleaning = false;
const publicSessions = new Set<string>();
async function cleanup() {
  if (cleaning) return;
  cleaning = true;
  try {
    if (userId) {
      try {
        await removePublicTestFiles(prefix, [...publicSessions]);
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
  if (message && typeof message === "object" && "type" in message) {
    if (message.type === "session" && "id" in message && typeof message.id === "string") publicSessions.add(message.id);
    if (message.type === "verify" && "reference" in message && typeof message.reference === "string") {
      verifyPublicTestApplication(prefix, message.reference).then(
        (counts) => process.send?.({ type: "verified", counts: JSON.stringify(counts) }),
        () => process.send?.({ type: "error", message: "Public application verification failed." }),
      );
    }
  }
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
  const outsider = process.argv[2] === "outsider";
  if (!outsider) await addAdmin(userId, email);
  const cookies: { name: string; value: string }[] = [];
  if (outsider) {
    const env = getPublicEnv();
    const client = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => cookies,
          setAll: (values) => {
            for (const { name, value } of values) {
              const existing = cookies.find((cookie) => cookie.name === name);
              if (existing) existing.value = value;
              else cookies.push({ name, value });
            }
          },
        },
      },
    );
    const signedIn = await client.auth.signInWithPassword({ email, password });
    if (signedIn.error) throw new Error("Outsider session creation failed");
  }
  // Credentials travel only over IPC to the fixture, never stdout or files.
  const publicJob = process.argv[2] === "public" ? await createPublicTestJob(prefix) : undefined;
  process.send?.({ type: "ready", email, password, prefix, cookieJSON: JSON.stringify(cookies), publicJobJSON: JSON.stringify(publicJob ?? null) });
}
setup().catch(async () => {
  process.send?.({ type: "error", message: "Guarded test fixture setup failed." });
  await cleanup();
});
