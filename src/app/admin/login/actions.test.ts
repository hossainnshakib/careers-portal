import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  findAdmin: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: mocks }),
}));
vi.mock("@/db/queries/admins", () => ({ findAdmin: mocks.findAdmin }));
import { login, logout } from "./actions";

describe("authentication actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.signOut.mockResolvedValue({ error: null });
  });
  it("validates credentials before attempting authentication", async () => {
    expect((await login({ email: "invalid", password: "" })).ok).toBe(false);
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });
  it("uses the same generic response for invalid passwords and non-allowlisted users", async () => {
    const input = { email: "test@example.com", password: "test-password" };
    mocks.signInWithPassword.mockResolvedValue({ error: new Error("Invalid password") });
    const passwordFailure = await login(input);
    mocks.signInWithPassword.mockResolvedValue({ error: null });
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-id", email: input.email } },
      error: null,
    });
    mocks.findAdmin.mockResolvedValue(null);
    expect(await login(input)).toEqual(passwordFailure);
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
  it.each(["anonymous", "non-admin"])(
    "logout rejects %s before changing Auth state",
    async (kind) => {
      mocks.getUser.mockResolvedValue({
        data: { user: kind === "anonymous" ? null : { id: "user-id", email: "test@example.com" } },
        error: null,
      });
      mocks.findAdmin.mockResolvedValue(null);
      expect((await logout()).ok).toBe(false);
      expect(mocks.signOut).not.toHaveBeenCalled();
    },
  );
  it("allows login and logout only after allowlist verification", async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: null });
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-id", email: "test@example.com" } },
      error: null,
    });
    mocks.findAdmin.mockResolvedValue({ userId: "user-id" });
    expect((await login({ email: "test@example.com", password: "test-password" })).ok).toBe(true);
    expect((await logout()).ok).toBe(true);
  });
});
