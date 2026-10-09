import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), getClaims: vi.fn(), findAdmin: vi.fn(), signInWithPassword: vi.fn(), listFactors: vi.fn(), enroll: vi.fn(), unenroll: vi.fn(), challengeAndVerify: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ auth: { ...mocks, mfa: mocks } }) }));
vi.mock("@/db/queries/admins", () => ({ findAdmin: mocks.findAdmin }));
vi.mock("@/db/queries/admin-sessions", () => ({ hasCurrentAdminSession: async () => true }));
import { enrollMfaAction, verifyMfaAction } from "./actions";
const id = "00000000-0000-4000-8000-000000000001";
const password = "correct horse battery staple";
beforeEach(() => {
  vi.resetAllMocks(); mocks.getUser.mockResolvedValue({ data: { user: { id, email: "admin@example.com" } }, error: null });
  mocks.findAdmin.mockResolvedValue({ userId: id }); mocks.getClaims.mockResolvedValue({ data: { claims: { sub: id, aal: "aal2", session_id: id } }, error: null });
  mocks.signInWithPassword.mockResolvedValue({ error: null });
  mocks.listFactors.mockResolvedValue({ data: { all: [] }, error: null });
  mocks.enroll.mockResolvedValue({ error: null, data: { id, totp: { qr_code: "qr-code", secret: "setup-secret" } } });
});
for (const invoke of [() => enrollMfaAction({}), () => verifyMfaAction({ factorId: id, code: "123456" })]) {
  it.each(["anonymous", "non-admin"])("MFA bootstrap rejects %s before enrollment/verification", async (kind) => {
    if (kind === "anonymous") mocks.getUser.mockResolvedValue({ data: { user: null }, error: null }); else mocks.findAdmin.mockResolvedValue(null);
    expect((await invoke()).ok).toBe(false); expect(mocks.signInWithPassword).not.toHaveBeenCalled(); expect(mocks.listFactors).not.toHaveBeenCalled(); expect(mocks.enroll).not.toHaveBeenCalled(); expect(mocks.challengeAndVerify).not.toHaveBeenCalled();
  });
}
it("enrollment requires the administrator password even for an allowlisted first-factor session", async () => {
  const missing = await enrollMfaAction({});
  expect(missing.ok).toBe(false); if (!missing.ok) expect(missing.error).toBe("Enter your administrator password to start authenticator setup.");
  expect(mocks.signInWithPassword).not.toHaveBeenCalled(); expect(mocks.enroll).not.toHaveBeenCalled();
});
it("does not enroll when the password is wrong", async () => {
  mocks.signInWithPassword.mockResolvedValue({ error: { message: "invalid_credentials" } });
  const result = await enrollMfaAction({ password: "wrong" });
  expect(result.ok).toBe(false); if (!result.ok) expect(result.error).toBe("Unable to start authenticator setup. Check your administrator password and try again.");
  expect(mocks.listFactors).not.toHaveBeenCalled(); expect(mocks.unenroll).not.toHaveBeenCalled(); expect(mocks.enroll).not.toHaveBeenCalled();
});
it("checks the password against the verified session subject, never an address from the request", async () => {
  expect((await enrollMfaAction({ password })).ok).toBe(true);
  expect(mocks.signInWithPassword).toHaveBeenCalledWith({ email: "admin@example.com", password });
});
it("does not allow a password-only caller to replace any verified factor", async () => {
  mocks.listFactors.mockResolvedValue({ data: { all: [{ id, status: "verified", factor_type: "totp" }] }, error: null });
  expect((await enrollMfaAction({ password })).ok).toBe(false); expect(mocks.unenroll).not.toHaveBeenCalled(); expect(mocks.enroll).not.toHaveBeenCalled();
});
it("reloads owned factors, validates codes and requires AAL2 after verification", async () => {
  expect((await verifyMfaAction({ factorId: id, code: "123456" })).ok).toBe(false); expect(mocks.challengeAndVerify).not.toHaveBeenCalled();
  mocks.listFactors.mockResolvedValue({ data: { all: [{ id, factor_type: "totp", status: "unverified" }] }, error: null });
  expect((await verifyMfaAction({ factorId: id, code: "bad" })).ok).toBe(false);
  mocks.challengeAndVerify.mockResolvedValue({ error: null }); expect((await verifyMfaAction({ factorId: id, code: "123456" })).ok).toBe(true);
  mocks.getClaims.mockResolvedValue({ data: { claims: { sub: id, aal: "aal1" } }, error: null });
  expect((await verifyMfaAction({ factorId: id, code: "123456" })).ok).toBe(false);
});
