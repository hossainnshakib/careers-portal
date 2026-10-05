import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ client: null as SupabaseClient | null }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => state.client }));

import { getDb, closeDb } from "@/db";
import { adminUsers } from "@/db/schema";
import { addAdmin } from "@/db/queries/admins";
import { requireDevTarget } from "@/db/seed/require-dev";
import { getPublicEnv } from "@/lib/env-public";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AdminAccessError, requireAdmin } from "./requireAdmin";

describe.skipIf(process.env.RUN_SUPABASE_TESTS !== "1")(
  "live requireAdmin gating (dev only)",
  () => {
    const ids: string[] = [];
    let management: SupabaseClient;
    let anonymous: SupabaseClient;
    let nonAdmin: SupabaseClient;
    let admin: SupabaseClient;
    let adminId: string;

    beforeAll(async () => {
      requireDevTarget();
      management = createSupabaseAdminClient();
      const env = getPublicEnv();
      const client = () =>
        createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
      anonymous = client();
      async function testAccount(allowlisted: boolean) {
        const email = `phase1-test-${randomUUID()}@example.com`;
        const password = `${randomUUID()}Aa9!`;
        const created = await management.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (created.error || !created.data.user)
          throw new Error("Ephemeral test account creation failed.");
        const id = created.data.user.id;
        ids.push(id);
        if (allowlisted) {
          await addAdmin(id, email);
          adminId = id;
        }
        const session = client();
        const signedIn = await session.auth.signInWithPassword({ email, password });
        if (signedIn.error) throw new Error("Ephemeral test account login failed.");
        return session;
      }
      nonAdmin = await testAccount(false);
      admin = await testAccount(true);
    }, 60000);

    afterAll(async () => {
      try {
        if (ids.length) await getDb().delete(adminUsers).where(inArray(adminUsers.userId, ids));
      } finally {
        try {
          if (management) {
            let failed = false;
            for (const id of ids) {
              const result = await management.auth.admin.deleteUser(id);
              if (result.error) failed = true;
            }
            if (failed) throw new Error("Ephemeral Auth account cleanup failed.");
          }
        } finally {
          await closeDb();
        }
      }
    }, 60000);

    it("rejects anonymous requests with real Supabase Auth", async () => {
      state.client = anonymous;
      await expect(requireAdmin()).rejects.toBeInstanceOf(AdminAccessError);
    });
    it("rejects a real authenticated user outside admin_users", async () => {
      state.client = nonAdmin;
      await expect(requireAdmin()).rejects.toBeInstanceOf(AdminAccessError);
    });
    it("accepts an ephemeral allowlisted admin", async () => {
      state.client = admin;
      const identity = await requireAdmin();
      expect(identity.userId === adminId).toBe(true);
    });
    it("immediately rejects an admin whose allowlist row is removed", async () => {
      await getDb().delete(adminUsers).where(eq(adminUsers.userId, adminId));
      state.client = admin;
      await expect(requireAdmin()).rejects.toBeInstanceOf(AdminAccessError);
    });
  },
);
