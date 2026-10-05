import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), findAdmin: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/db/queries/admins", () => ({ findAdmin: mocks.findAdmin }));
import { AdminAccessError, requireAdmin } from "./requireAdmin";

describe("requireAdmin", () => {
  beforeEach(() => vi.resetAllMocks());
  it("denies unauthenticated requests before accessing the allowlist", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(requireAdmin()).rejects.toBeInstanceOf(AdminAccessError);
    expect(mocks.findAdmin).not.toHaveBeenCalled();
  });
  it("denies authenticated users outside admin_users", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-id", email: "test@example.com" } },
      error: null,
    });
    mocks.findAdmin.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toBeInstanceOf(AdminAccessError);
    expect(mocks.findAdmin).toHaveBeenCalledWith("user-id");
  });
  it("rejects an Auth error even if the response includes a user", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-id", email: "test@example.com" } },
      error: new Error("Auth error"),
    });
    await expect(requireAdmin()).rejects.toBeInstanceOf(AdminAccessError);
    expect(mocks.findAdmin).not.toHaveBeenCalled();
  });
  it("returns only the verified identity for an allowlisted user", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-id", email: "test@example.com" } },
      error: null,
    });
    mocks.findAdmin.mockResolvedValue({ userId: "user-id" });
    await expect(requireAdmin()).resolves.toEqual({ userId: "user-id", email: "test@example.com" });
  });
  it("fails closed if the allowlist database is unavailable", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-id", email: "test@example.com" } },
      error: null,
    });
    mocks.findAdmin.mockRejectedValue(new Error("Database unavailable"));
    await expect(requireAdmin()).rejects.toThrow("Database unavailable");
  });
});
