import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ objects: new Set<string>(), failMove: false, failRemove: false, failInspect: false, signed: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("./client", () => ({ getStorageClient: () => ({ from: () => ({
  info: async (path: string) => state.failInspect ? { data: null, error: { status: 403, statusCode: "403", code: "AccessDenied" } } :
    state.objects.has(path) ? { data: { size: 100 }, error: null } : { data: null, error: { status: 400, statusCode: "404", code: "NoSuchKey" } },
  move: async (from: string, to: string) => {
    if (state.failMove || !state.objects.has(from) || state.objects.has(to)) return { error: new Error("Move failed") };
    state.objects.delete(from); state.objects.add(to); return { error: null };
  },
  list: async (folder: string) => ({ data: [...state.objects].filter((path) => path.startsWith(`${folder}/`)).map((path) => ({ name: path.split("/").at(-1), id: "object-id" })), error: null }),
  remove: async (paths: string[]) => { if (state.failRemove) return { error: new Error("Removal failed") }; paths.forEach((path) => state.objects.delete(path)); return { error: null }; },
  createSignedUrl: state.signed,
}) }) }));
import { quarantineReviewFiles, removeReviewQuarantine, restoreReviewFiles, signReviewAttachment } from "./review-files";
const appId = "00000000-0000-4000-8000-000000000001";
const file = { id: "00000000-0000-4000-8000-000000000002", applicationId: appId, storagePath: `applications/${appId}/cv.pdf`, fileName: "cv.pdf" };
const pending = `deleting/${appId}/${file.id}`;
beforeEach(() => { state.objects.clear(); state.objects.add(file.storagePath); state.failMove = false; state.failRemove = false; state.failInspect = false; state.signed.mockReset(); });
it("quarantines files reversibly, restores interrupted deletion and finally removes private quarantine", async () => {
  await quarantineReviewFiles([file]); expect(state.objects.has(file.storagePath)).toBe(false); expect(state.objects.has(pending)).toBe(true);
  await restoreReviewFiles([file]); expect(state.objects.has(file.storagePath)).toBe(true); expect(state.objects.has(pending)).toBe(false);
  await quarantineReviewFiles([file]); await removeReviewQuarantine(appId); expect(state.objects.size).toBe(0);
});
it("preserves originals on move failure and preserves quarantined objects on cleanup failure for retry", async () => {
  state.failMove = true; await expect(quarantineReviewFiles([file])).rejects.toThrow(); expect(state.objects.has(file.storagePath)).toBe(true);
  state.failMove = false; await quarantineReviewFiles([file]); state.failRemove = true;
  await expect(removeReviewQuarantine(appId)).rejects.toThrow(); expect(state.objects.has(pending)).toBe(true);
  state.failRemove = false; await removeReviewQuarantine(appId); expect(state.objects.size).toBe(0);
});
it("fails closed for foreign application paths and uses 60-second download URLs with sanitized filenames", async () => {
  state.signed.mockResolvedValue({ data: { signedUrl: "https://storage.example.test/signed" }, error: null });
  await expect(signReviewAttachment({ ...file, storagePath: "applications/another/cv.pdf" })).rejects.toThrow();
  expect(state.signed).not.toHaveBeenCalled();
  await signReviewAttachment({ ...file, fileName: "cv\r\n.pdf" });
  expect(state.signed).toHaveBeenCalledWith(file.storagePath, 60, { download: "cv__.pdf" });
});
it("distinguishes actual missing objects from permission or infrastructure failures", async () => {
  state.failInspect = true;
  await expect(quarantineReviewFiles([file])).rejects.toThrow("Cannot inspect");
  expect(state.objects.has(file.storagePath)).toBe(true);
  state.failInspect = false; state.objects.clear();
  await quarantineReviewFiles([file]); // An already absent file does not block deleting its DB reference.
});
