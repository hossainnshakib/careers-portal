import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), cleanup: vi.fn(), check: vi.fn() }));
vi.mock("@/lib/auth/cron", () => ({ hasCronAuthorization: mocks.auth }));
vi.mock("@/lib/storage/cleanup-pending", () => ({ cleanupPendingUploads: mocks.cleanup }));
vi.mock("@/db/queries/maintenance", () => ({ checkDatabaseConnection: mocks.check }));
import { GET } from "./route";

beforeEach(() => {
  vi.resetAllMocks(); mocks.auth.mockReturnValue(true);
  mocks.cleanup.mockResolvedValue({ scannedObjects: 5, removedObjects: 3 });
  mocks.check.mockResolvedValue(undefined);
});
it("denies maintenance before Storage or database access", async () => {
  mocks.auth.mockReturnValue(false);
  const response = await GET(new Request("https://careers.example.test/api/cron/daily"));
  expect(response.status).toBe(401);
  expect(mocks.cleanup).not.toHaveBeenCalled(); expect(mocks.check).not.toHaveBeenCalled();
});
it("returns counts only after authorized cleanup and keep-alive", async () => {
  const response = await GET(new Request("https://careers.example.test/api/cron/daily", { headers: { Authorization: "Bearer synthetic-secret" } }));
  expect(mocks.auth).toHaveBeenCalledWith("Bearer synthetic-secret");
  expect(mocks.check).toHaveBeenCalledOnce();
  expect(await response.json()).toEqual({ scannedObjects: 5, removedObjects: 3 });
  expect(response.headers.get("cache-control")).toContain("no-store");
});
it.each(["cleanup", "check"] as const)("returns only a generic failure when %s fails", async (kind) => {
  mocks[kind].mockRejectedValue(new Error("Sensitive provider diagnostic"));
  const response = await GET(new Request("https://careers.example.test/api/cron/daily"));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ ok: false, error: "Daily maintenance failed." });
});
