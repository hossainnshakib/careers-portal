import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), findAdmin: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/db/queries/admins", () => ({ findAdmin: mocks.findAdmin }));
vi.mock("next/navigation", () => ({
  redirect: () => {
    throw new Error("LOGIN_REDIRECT");
  },
}));
vi.mock("@/components/admin/logout-button", () => ({ LogoutButton: () => null }));
import Layout from "@/app/admin/(protected)/layout";
import Dashboard from "@/app/admin/(protected)/page";
import Applications from "@/app/admin/(protected)/applications/page";
import Departments from "@/app/admin/(protected)/departments/page";
vi.mock("@/db/queries/departments", () => ({ listDepartments: vi.fn() }));

describe("protected admin pages independently gate access", () => {
  beforeEach(() => vi.resetAllMocks());
  const surfaces = [
    ["layout", () => Layout({ children: null })],
    ["/admin", Dashboard],
    ["/admin/applications", Applications],
    ["/admin/departments", Departments],
  ] as const;
  for (const [name, invoke] of surfaces) {
    it.each(["anonymous", "non-admin"])(
      `${name} rejects %s without relying on middleware/layout`,
      async (kind) => {
        mocks.getUser.mockResolvedValue({
          data: {
            user: kind === "anonymous" ? null : { id: "user-id", email: "test@example.com" },
          },
          error: null,
        });
        mocks.findAdmin.mockResolvedValue(null);
        await expect(invoke()).rejects.toThrow("LOGIN_REDIRECT");
        expect(mocks.getUser).toHaveBeenCalledOnce();
      },
    );
    it(`${name} fails closed on database failure`, async () => {
      mocks.getUser.mockResolvedValue({
        data: { user: { id: "user-id", email: "test@example.com" } },
        error: null,
      });
      mocks.findAdmin.mockRejectedValue(new Error("Database unavailable"));
      await expect(invoke()).rejects.toThrow("Database unavailable");
    });
  }
});
