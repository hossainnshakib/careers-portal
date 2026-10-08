import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), getClaims: vi.fn(), findAdmin: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser, getClaims: mocks.getClaims } }),
}));
vi.mock("@/db/queries/admins", () => ({ findAdmin: mocks.findAdmin }));
import { AdminAccessError, AdminMfaRequiredError, requireAdmin } from "./requireAdmin";

describe("requireAdmin", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user-id", aal: "aal2" } }, error: null }); });
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
    await expect(requireAdmin()).rejects.toThrow("Unable to verify administrator access.");
  });
  it("requires verified AAL2 and limits the bootstrap exception", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-id", email: "test@example.com" } }, error: null });
    mocks.findAdmin.mockResolvedValue({ userId: "user-id" });
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user-id", aal: "aal1" } }, error: null });
    await expect(requireAdmin()).rejects.toBeInstanceOf(AdminMfaRequiredError);
    await expect(requireAdmin({ allowMfaSetup: true })).resolves.toMatchObject({ userId: "user-id" });
    for (const claims of [{ data: { claims: { sub: "other-user", aal: "aal2" } }, error: null }, { data: null, error: new Error("Invalid signature") }]) {
      mocks.getClaims.mockResolvedValue(claims); await expect(requireAdmin()).rejects.toBeInstanceOf(AdminAccessError);
    }
    mocks.findAdmin.mockResolvedValue(null);
    await expect(requireAdmin({ allowMfaSetup: true })).rejects.toBeInstanceOf(AdminAccessError);
  });
  it("discards raw provider/DB exception details instead of attaching them to framework errors", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-id", email: "test@example.com" } }, error: null });
    mocks.findAdmin.mockRejectedValue(new Error("Sensitive query parameter: fixture@example.com"));
    let caught: unknown;
    try { await requireAdmin(); } catch (error) { caught = error; }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toBe("Unable to verify administrator access.");
    expect((caught as Error).cause).toBeUndefined();
    expect(String(caught)).not.toContain("fixture@example.com");
  });
});
