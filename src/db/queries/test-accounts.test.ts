import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ guard: vi.fn(), execute: vi.fn(), deleteUser: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ getDb: () => ({ execute: mocks.execute }) }));
vi.mock("@/db/seed/require-dev", () => ({ requireDevTarget: mocks.guard }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: () => ({ auth: { admin: { deleteUser: mocks.deleteUser } } }) }));
import { removeOrphanAdmins, sweepTestAccounts } from "./test-accounts";

beforeEach(() => { vi.resetAllMocks(); });
it.each([removeOrphanAdmins, sweepTestAccounts])("refuses cleanup before database or Auth access when the dev guard fails", async (run) => {
  mocks.guard.mockImplementation(() => { throw new Error("Refused dev target"); });
  await expect(run()).rejects.toThrow();
  expect(mocks.execute).not.toHaveBeenCalled();
  expect(mocks.deleteUser).not.toHaveBeenCalled();
});
it("reports a failed Auth deletion rather than silently succeeding", async () => {
  mocks.execute.mockResolvedValueOnce([{ id: "fixture-user" }]).mockResolvedValueOnce([]);
  mocks.deleteUser.mockResolvedValue({ error: {} });
  await expect(sweepTestAccounts()).rejects.toThrow("Test account sweep failed");
});
