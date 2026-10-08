import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireDevTarget: vi.fn(),
  addAdmin: vi.fn(),
  listUsers: vi.fn(),
  requireAllowedTarget: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ closeDb: vi.fn() }));
vi.mock("@/db/queries/admins", () => ({ addAdmin: mocks.addAdmin }));
vi.mock("@/db/seed/require-dev", () => ({ requireDevTarget: mocks.requireDevTarget }));
vi.mock("@/lib/maintenance/require-target", () => ({ requireAllowedTarget: mocks.requireAllowedTarget }));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ auth: { admin: { listUsers: mocks.listUsers } } }),
}));
import { allowlistExistingAdmin, allowlistExistingAdminForOwner } from "./admin-add";

describe("admin:add", () => {
  beforeEach(() => vi.resetAllMocks());
  it("refuses a non-dev target before querying Auth or the database", async () => {
    mocks.requireDevTarget.mockImplementation(() => {
      throw new Error("Refused");
    });
    await expect(allowlistExistingAdmin("test@example.com")).rejects.toThrow("Refused");
    expect(mocks.listUsers).not.toHaveBeenCalled();
    expect(mocks.addAdmin).not.toHaveBeenCalled();
  });
  it("validates the email", async () => {
    await expect(allowlistExistingAdmin("invalid")).rejects.toThrow();
    expect(mocks.listUsers).not.toHaveBeenCalled();
  });
  it("owner setup refuses before Auth access when its independent target guard fails", async () => {
    mocks.requireAllowedTarget.mockImplementation(() => { throw new Error("Refused owner target"); });
    await expect(allowlistExistingAdminForOwner("test@example.com")).rejects.toThrow("Refused owner target");
    expect(mocks.listUsers).not.toHaveBeenCalled(); expect(mocks.addAdmin).not.toHaveBeenCalled();
  });
  it("searches past the first page and normalizes the email", async () => {
    mocks.listUsers.mockResolvedValueOnce({
      data: {
        users: Array.from({ length: 100 }, (_, i) => ({
          id: `${i}`,
          email: `other-${i}@example.com`,
        })),
      },
      error: null,
    });
    mocks.listUsers.mockResolvedValueOnce({
      data: { users: [{ id: "target", email: "TEST@example.com" }] },
      error: null,
    });
    await allowlistExistingAdmin("Test@example.com");
    expect(mocks.listUsers).toHaveBeenLastCalledWith({ page: 2, perPage: 100 });
    expect(mocks.addAdmin).toHaveBeenCalledWith("target", "test@example.com");
  });
  it("never creates an Auth user if no existing user matches", async () => {
    mocks.listUsers.mockResolvedValue({ data: { users: [] }, error: null });
    await expect(allowlistExistingAdmin("test@example.com")).rejects.toThrow(
      "Create the Auth user",
    );
    expect(mocks.addAdmin).not.toHaveBeenCalled();
  });
});
