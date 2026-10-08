import "server-only";

import { randomUUID } from "node:crypto";
import { closeDb, getDb } from "../../src/db/index";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { addAdmin } from "../../src/db/queries/admins";
import { removeTestFixture } from "../../src/db/queries/test-fixtures";
import { requireDevTarget } from "../../src/db/seed/require-dev";
import { createSupabaseAdminClient } from "../../src/lib/supabase/admin";
import { removeTestLogos } from "../../src/lib/storage/test-logos";
import { createServerClient } from "@supabase/ssr";
import { getPublicEnv } from "../../src/lib/env-public";
import { createClient } from "@supabase/supabase-js";
import { freshTestTotp } from "./totp";
import { createPublicTestJob, verifyPublicTestApplication } from "../../src/db/queries/public-test-fixture";
import { removePublicTestFiles } from "../../src/lib/storage/public-test-files";
import { createReviewTestApplication, reviewTestApplicationIds, verifyReviewTestRows } from "../../src/db/queries/review-test-fixture";
import { removeReviewTestFiles, reviewTestFilesAbsent } from "../../src/lib/storage/review-test-files";
import { adminCookieOptions, adminCookieWriteOptions } from "../../src/lib/auth/session-cookies";

let userId: string | undefined;
const prefix = `e2e-${randomUUID().replaceAll("-", "")}-`;
let cleaning = false;
const publicSessions = new Set<string>();
const reviewIds = new Set<string>();
let authenticatorSecret = "";
let authenticatorFactorId = "";
async function sessionOperation(message: { type: string; cookies?: unknown }) {
  requireDevTarget(); if (!userId) throw new Error("Fixture identity missing");
  const management = createSupabaseAdminClient();
  if (message.type === "change-password") {
    const password = `${randomUUID()}Aa9!`;
    if ((await management.auth.admin.updateUserById(userId, { password })).error) throw new Error("Fixture password update failed");
    process.send?.({ type: "password-changed", password }); return;
  }
  if (message.type === "remove-factor") {
    if (!authenticatorFactorId || (await management.auth.admin.mfa.deleteFactor({ userId, id: authenticatorFactorId })).error) throw new Error("Fixture factor update failed");
    process.send?.({ type: "factor-removed" }); return;
  }
  const cookies = z.array(z.object({ name: z.string(), value: z.string() })).parse(JSON.parse(z.string().parse(message.cookies)));
  const env = getPublicEnv();
  const client = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookieOptions: adminCookieOptions(false), cookies: { getAll: () => cookies, setAll: values => {
      for (const cookie of values) {
        const index = cookies.findIndex(item => item.name === cookie.name);
        if (index >= 0) cookies.splice(index, 1);
        if (cookie.options.maxAge !== 0) cookies.push({ name: cookie.name, value: cookie.value });
      }
    } },
  });
  const user = await client.auth.getUser(); if (user.error || user.data.user?.id !== userId) throw new Error("Fixture session mismatch");
  if (message.type === "refresh-session") {
    const refreshed = await client.auth.refreshSession(); if (refreshed.error) throw new Error("Fixture refresh failed");
    const claims = await client.auth.getClaims(); if (claims.error || claims.data?.claims.sub !== userId || claims.data.claims.aal !== "aal2") throw new Error("Refresh lost verified assurance");
    const options = adminCookieWriteOptions({}, false);
    process.send?.({ type: "session-refreshed", cookies: JSON.stringify(cookies.map(cookie => ({ ...cookie, domain: "localhost", path: "/", httpOnly: true, secure: false, sameSite: "Lax", expires: Math.floor(options.expires!.getTime() / 1000) }))) });
  } else {
    const claims = await client.auth.getClaims();
    const sessionId = z.uuid().parse(claims.data?.claims.session_id);
    if (claims.error || claims.data?.claims.sub !== userId) throw new Error("Fixture claims mismatch");
    await getDb().execute(sql`update auth.sessions set created_at = now() - interval '31 days' where id = ${sessionId}::uuid and user_id = ${userId}::uuid`);
    process.send?.({ type: "session-expired" });
  }
}
async function cleanup() {
  if (cleaning) return;
  cleaning = true;
  try {
    if (userId) {
      try {
        await removePublicTestFiles(prefix, [...publicSessions]);
        await removeReviewTestFiles([...new Set([...reviewIds, ...await reviewTestApplicationIds(prefix)])]);
        const brands = await removeTestFixture(userId, prefix);
        await removeTestLogos(brands);
      } finally {
        const { error } = await createSupabaseAdminClient().auth.admin.deleteUser(userId);
        if (error) throw new Error("Auth cleanup failed");
      }
    }
    if (process.connected) process.send?.({ type: "cleaned" });
  } catch {
    if (process.connected) process.send?.({ type: "error", message: "Test fixture cleanup failed." });
  } finally {
    await closeDb();
    process.exit();
  }
}
process.on("message", (message) => {
  if (message === "cleanup") void cleanup();
  if (message === "otp" && authenticatorSecret) void freshTestTotp(authenticatorSecret).then((code) => process.send?.({ type: "otp", code }));
  if (message && typeof message === "object" && "type" in message) {
    if (typeof message.type === "string" && ["refresh-session", "expire-session", "change-password", "remove-factor"].includes(message.type)) {
      void sessionOperation(message as { type: string; cookies?: unknown }).catch(() => process.send?.({ type: "error", message: "Guarded fixture session operation failed." }));
    }
    if (message.type === "session" && "id" in message && typeof message.id === "string") publicSessions.add(message.id);
    if (message.type === "verify" && "reference" in message && typeof message.reference === "string") {
      verifyPublicTestApplication(prefix, message.reference).then(
        (counts) => process.send?.({ type: "verified", counts: JSON.stringify(counts) }),
        () => process.send?.({ type: "error", message: "Public application verification failed." }),
      );
    }
    if (message.type === "review-verify" && "id" in message && typeof message.id === "string" && reviewIds.has(message.id)) {
      const id = message.id;
      Promise.all([verifyReviewTestRows(prefix, id), reviewTestFilesAbsent(id)]).then(
        ([counts, filesAbsent]) => process.send?.({ type: "review-verified", counts: JSON.stringify({ ...counts, filesAbsent }) }),
        () => process.send?.({ type: "error", message: "Review fixture verification failed." }),
      );
    }
  }
});
process.on("disconnect", () => {
  void cleanup();
});
process.on("SIGINT", () => { void cleanup(); });
process.on("SIGTERM", () => { void cleanup(); });

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
  if (!outsider && process.argv[2] !== "mfa") {
    const env = getPublicEnv();
    const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    if ((await client.auth.signInWithPassword({ email, password })).error) throw new Error("MFA fixture login failed");
    const factor = await client.auth.mfa.enroll({ factorType: "totp", friendlyName: "Fixture authenticator" });
    if (factor.error) throw new Error("MFA fixture enrollment failed");
    authenticatorSecret = factor.data.totp.secret;
    authenticatorFactorId = factor.data.id;
    if ((await client.auth.mfa.challengeAndVerify({ factorId: factor.data.id, code: await freshTestTotp(authenticatorSecret) })).error) throw new Error("MFA fixture verification failed");
  }
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
  const reviewApplication = process.argv[2] === "review" ? await createReviewTestApplication(prefix) : undefined;
  if (reviewApplication) { reviewIds.add(reviewApplication.applicationId); reviewIds.add(reviewApplication.previousId); }
  process.send?.({ type: "ready", email, password, prefix, cookieJSON: JSON.stringify(cookies), publicJobJSON: JSON.stringify(publicJob ?? null), reviewJSON: JSON.stringify(reviewApplication ?? null) });
}
setup().catch(async () => {
  process.send?.({ type: "error", message: "Guarded test fixture setup failed." });
  await cleanup();
});
