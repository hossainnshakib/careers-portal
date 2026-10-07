import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ client: null as SupabaseClient | null }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => state.client }));
vi.mock("next/cache", () => ({
  revalidateTag: () => {
    throw new Error("Unexpected mutation");
  },
  revalidatePath: () => {
    throw new Error("Unexpected mutation");
  },
}));
import { closeDb } from "@/db";
import { requireDevTarget } from "@/db/seed/require-dev";
import { getPublicEnv } from "@/lib/env-public";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import Dashboard from "@/app/admin/(protected)/page";
import Applications from "@/app/admin/(protected)/applications/page";
import Profile from "@/app/admin/(protected)/applications/[id]/page";
import { GET as attachmentDownload } from "@/app/api/admin/attachments/[id]/route";
import { GET as pdfDownload } from "@/app/api/admin/applications/[id]/pdf/route";
import Mfa from "@/app/admin/mfa/page";
import Brands from "@/app/admin/(protected)/brands/page";
import Departments from "@/app/admin/(protected)/departments/page";
import Jobs from "@/app/admin/(protected)/jobs/page";
import NewJob from "@/app/admin/(protected)/jobs/new/page";
import EditJob from "@/app/admin/(protected)/jobs/[id]/edit/page";
import Layout from "@/app/admin/(protected)/layout";
import * as authActions from "@/app/admin/login/actions";
import * as departmentActions from "@/app/admin/(protected)/departments/actions";
import * as brandActions from "@/app/admin/(protected)/brands/actions";
import * as jobActions from "@/app/admin/(protected)/jobs/actions";
import * as reviewActions from "@/app/admin/(protected)/applications/actions";
import * as mfaActions from "@/app/admin/mfa/actions";

describe.skipIf(process.env.RUN_SUPABASE_TESTS !== "1")(
  "all live admin surfaces reject anonymous/non-allowlisted users",
  () => {
    let management: SupabaseClient;
    let anonymous: SupabaseClient;
    let outsider: SupabaseClient;
    let userId: string | undefined;
    let email: string;
    let password: string;
    beforeAll(async () => {
      requireDevTarget();
      management = createSupabaseAdminClient();
      const env = getPublicEnv();
      const client = () =>
        createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
      anonymous = client();
      outsider = client();
      email = `gating-${randomUUID()}@example.com`;
      password = `${randomUUID()}Aa9!`;
      const created = await management.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (created.error || !created.data.user) throw new Error("Test account setup failed");
      userId = created.data.user.id;
      const login = await outsider.auth.signInWithPassword({ email, password });
      if (login.error) throw new Error("Test login failed");
    }, 60000);
    afterAll(async () => {
      try {
        if (userId) {
          const result = await management.auth.admin.deleteUser(userId);
          if (result.error) throw new Error("Test user cleanup failed");
        }
      } finally {
        await closeDb();
      }
    }, 60000);
    const pages = [
      ["layout", () => Layout({ children: null })],
      ["dashboard", Dashboard],
      ["applications", () => Applications({ searchParams: Promise.resolve({}) })],
      ["profile", () => Profile({ params: Promise.resolve({ id: "invalid" }) })],
      ["mfa", Mfa],
      ["brands", Brands],
      ["departments", Departments],
      ["jobs", () => Jobs({ searchParams: Promise.resolve({}) })],
      ["new job", NewJob],
      ["edit job", () => EditJob({ params: Promise.resolve({ id: "invalid" }) })],
    ] as const;
    for (const [name, invoke] of pages)
      it.each(["anonymous", "outsider"])(
        `${name} rejects %s using real Auth+allowlist`,
        async (kind) => {
          state.client = kind === "anonymous" ? anonymous : outsider;
          let denied = false;
          try {
            await invoke();
          } catch (error) {
            denied = error instanceof Error && error.message === "NEXT_REDIRECT";
          }
          expect(denied).toBe(true);
        },
        30000,
      );
    const actions = [
      authActions.logout,
      departmentActions.saveDepartmentAction,
      departmentActions.reorderDepartmentAction,
      brandActions.saveBrandAction,
      brandActions.reorderBrandAction,
      (input: unknown) => brandActions.uploadBrandLogoAction(input as FormData),
      jobActions.saveJobAction,
      jobActions.jobCommandAction,
      jobActions.copyJobQuestionsAction,
      reviewActions.changeStatusAction,
      reviewActions.addNoteAction,
      reviewActions.deleteNoteAction,
      reviewActions.deleteApplicationAction,
      mfaActions.enrollMfaAction,
      mfaActions.verifyMfaAction,
    ];
    for (const [index, action] of actions.entries())
      it.each(["anonymous", "outsider"])(
        `action ${index + 1} rejects %s before parsing or mutation`,
        async (kind) => {
          state.client = kind === "anonymous" ? anonymous : outsider;
          const result = await action({});
          expect(result.ok).toBe(false);
          if (!result.ok) expect(result.error).toBe("Administrator access required.");
        },
        30000,
      );
    it.each(["anonymous", "outsider"])("attachment route rejects %s using real Auth+allowlist", async (kind) => {
      state.client = kind === "anonymous" ? anonymous : outsider;
      const response = await attachmentDownload(new Request("http://localhost/api/admin/attachments/invalid"), { params: Promise.resolve({ id: "invalid" }) });
      expect(response.status).toBe(403);
      expect(response.headers.has("location")).toBe(false);
    }, 30000);
    it.each(["anonymous", "outsider"])("PDF route rejects %s before applicant reads", async (kind) => {
      state.client = kind === "anonymous" ? anonymous : outsider;
      const response = await pdfDownload(new Request("http://localhost/api/admin/applications/invalid/pdf"), { params: Promise.resolve({ id: "invalid" }) });
      expect(response.status).toBe(403);
    }, 30000);
    it("public login rejects valid non-admin credentials and clears that session", async () => {
      state.client = outsider;
      expect((await authActions.login({ email, password })).ok).toBe(false);
      expect((await outsider.auth.getUser()).data.user === null).toBe(true);
    }, 30000);
  },
);
