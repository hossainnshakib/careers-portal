import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), ownerGuard: vi.fn(), download: vi.fn(), remove: vi.fn(), client: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db/seed/require-dev", () => ({ requireDevTarget: mocks.guard }));
vi.mock("@/lib/maintenance/require-target", () => ({ requireConversionCleanupTarget: mocks.ownerGuard }));
vi.mock("./client", () => ({ getStorageClient: mocks.client }));
import { artifactHash, removeCleanupArtifacts } from "./demo-cleanup";

const artifact = { id: "00000000-0000-4000-8000-000000000001", name: "pending/00000000-0000-4000-8000-000000000002/reservations/00000000-0000-4000-8000-000000000001.json", size: 4, mime: "application/json", sha256: artifactHash(Buffer.from("test")) };
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("DEV_SUPABASE_PROJECT_REF", "xmtoccukridshadnxrlc");
  mocks.client.mockReturnValue({ from: () => ({ download: mocks.download, remove: mocks.remove }) });
  mocks.download.mockResolvedValue({ data: new Blob(["test"]), error: null });
  mocks.remove.mockResolvedValue({ data: [{}], error: null });
});
it("checks bytes but never removes during dry-run", async () => {
  expect(await removeCleanupArtifacts([artifact], false)).toEqual({ removed: 0, verified: 1 });
  expect(mocks.remove).not.toHaveBeenCalled();
});
it("removes only the verified exact paths on apply, and empty rerun is a no-op", async () => {
  expect(await removeCleanupArtifacts([artifact], true)).toEqual({ removed: 1, verified: 1 });
  expect(mocks.remove).toHaveBeenCalledWith([artifact.name]);
  mocks.remove.mockClear(); expect(await removeCleanupArtifacts([], true)).toEqual({ removed: 0, verified: 0 });
  expect(mocks.remove).not.toHaveBeenCalled();
});
it("rejects mismatched bytes, duplicate IDs, non-pending paths and download failures before deletion", async () => {
  for (const artifacts of [[{ ...artifact, sha256: "a".repeat(64) }], [artifact, artifact], [{ ...artifact, name: "applications/unrelated/file.pdf" }]]) await expect(removeCleanupArtifacts(artifacts, true)).rejects.toThrow();
  mocks.download.mockResolvedValue({ error: new Error("private provider detail") });
  await expect(removeCleanupArtifacts([artifact], true)).rejects.toThrow("Cannot back up");
  expect(mocks.remove).not.toHaveBeenCalled();
});
it("fails closed on DEV guard denial or a different independently pinned project", async () => {
  mocks.guard.mockImplementationOnce(() => { throw new Error("Production refused"); });
  await expect(removeCleanupArtifacts([artifact], true)).rejects.toThrow();
  vi.stubEnv("DEV_SUPABASE_PROJECT_REF", "abcdefghijklmnopqrst");
  await expect(removeCleanupArtifacts([artifact], true)).rejects.toThrow();
  expect(mocks.client).not.toHaveBeenCalled();
});
it("owner conversion is separate, independently gated and dry-run by default", async () => {
  expect(await removeCleanupArtifacts([artifact], false, true)).toEqual({ removed: 0, verified: 1 });
  expect(mocks.ownerGuard).toHaveBeenCalledWith(false);
  expect(mocks.guard).not.toHaveBeenCalled(); expect(mocks.remove).not.toHaveBeenCalled();
});
it("owner apply denial prevents Storage access and successful mocked apply still removes only exact paths", async () => {
  mocks.ownerGuard.mockImplementationOnce(() => { throw new Error("No owner approval"); });
  await expect(removeCleanupArtifacts([artifact], true, true)).rejects.toThrow("No owner approval");
  expect(mocks.client).not.toHaveBeenCalled();
  expect(await removeCleanupArtifacts([artifact], true, true)).toEqual({ removed: 1, verified: 1 });
  expect(mocks.ownerGuard).toHaveBeenCalledWith(true);
  expect(mocks.remove).toHaveBeenCalledWith([artifact.name]);
});
