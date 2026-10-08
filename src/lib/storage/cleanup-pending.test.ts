import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ from: vi.fn(), list: vi.fn(), remove: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("./client", () => ({ getStorageClient: () => ({ from: mocks.from }) }));
import { cleanupPendingUploads } from "./cleanup-pending";

const now = new Date("2026-10-08T00:00:00Z");
const old = "2026-10-06T23:59:59Z";
const recent = "2026-10-07T12:00:00Z";
const file = (name: string, created_at = old, updated_at = created_at) => ({ id: "synthetic-object", name, created_at, updated_at });
const folder = (name: string) => ({ id: null, name });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.from.mockReturnValue({ list: mocks.list, remove: mocks.remove });
  mocks.list.mockResolvedValue({ data: [], error: null });
  mocks.remove.mockImplementation(async (paths: string[]) => ({ data: paths.map(name => ({ name })), error: null }));
});
it("recurses through sessions and reservations, deleting only stale pending objects", async () => {
  const entries: Record<string, unknown[]> = {
    pending: [folder("session")],
    "pending/session": [file("old.pdf"), file("recent.pdf", recent), file("touched.pdf", old, recent), file("exact-cutoff.pdf", "2026-10-07T00:00:00Z"), file("invalid.pdf", "invalid"), folder("reservations")],
    "pending/session/reservations": [file("old.json")],
  };
  mocks.list.mockImplementation(async (prefix: string) => ({ data: entries[prefix] ?? [], error: null }));
  expect(await cleanupPendingUploads(now)).toEqual({ scannedObjects: 6, removedObjects: 2 });
  expect(mocks.from).toHaveBeenCalledWith("applications");
  expect(mocks.remove).toHaveBeenCalledWith(["pending/session/old.pdf", "pending/session/reservations/old.json"]);
  expect(mocks.list.mock.calls.every(([prefix]) => prefix === "pending" || prefix.startsWith("pending/"))).toBe(true);
});
it("completes paginated collection before batch removal so offsets cannot skip objects", async () => {
  mocks.list.mockImplementation(async (_prefix: string, { offset }: { offset: number }) => {
    expect(mocks.remove).not.toHaveBeenCalled();
    return { data: offset === 0 ? Array.from({ length: 1000 }, (_, i) => file(`${i}.pdf`)) : [file("last.pdf")], error: null };
  });
  expect(await cleanupPendingUploads(now)).toEqual({ scannedObjects: 1001, removedObjects: 1001 });
  expect(mocks.list).toHaveBeenCalledWith("pending", expect.objectContaining({ offset: 1000 }));
  expect(mocks.remove).toHaveBeenCalledTimes(11);
  expect(mocks.remove.mock.calls.every(([paths]) => paths.length <= 100)).toBe(true);
});
it("does not remove anything when a later folder cannot be inspected", async () => {
  mocks.list.mockResolvedValueOnce({ data: [folder("a"), folder("b")], error: null })
    .mockResolvedValueOnce({ data: [file("old.pdf")], error: null })
    .mockResolvedValueOnce({ data: null, error: {} });
  await expect(cleanupPendingUploads(now)).rejects.toThrow("inspect");
  expect(mocks.remove).not.toHaveBeenCalled();
});
it("reports removal failures rather than claiming a successful cleanup", async () => {
  mocks.list.mockResolvedValue({ data: [file("old.pdf")], error: null });
  mocks.remove.mockResolvedValue({ data: null, error: {} });
  await expect(cleanupPendingUploads(now)).rejects.toThrow("remove");
});
it.each(["..", "../applications", "a/b", "a\\b"])("rejects unsafe provider entry names", async (name) => {
  mocks.list.mockResolvedValue({ data: [file(name)], error: null });
  await expect(cleanupPendingUploads(now)).rejects.toThrow("Invalid");
  expect(mocks.remove).not.toHaveBeenCalled();
});
it("handles empty or already-cleaned pending storage idempotently", async () => {
  expect(await cleanupPendingUploads(now)).toEqual({ scannedObjects: 0, removedObjects: 0 });
  expect(mocks.remove).not.toHaveBeenCalled();
});
