import { beforeEach, expect, it, vi } from "vitest";
import { applications, attachments } from "@/db/schema";
const mocks = vi.hoisted(() => ({ quarantine: vi.fn(), restore: vi.fn(), cleanup: vi.fn() }));
const state = vi.hoisted(() => ({ exists: true, deleted: 0, lockCalls: 0, failCommit: false, committedDespiteError: false }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/storage/review-files", () => ({ quarantineReviewFiles: mocks.quarantine, restoreReviewFiles: mocks.restore, removeReviewQuarantine: mocks.cleanup, signReviewAttachment: vi.fn() }));
vi.mock("@/db/queries/applications", () => ({
  withUploadSession: async (_id: string, work: (tx: object) => Promise<unknown>) => {
    const first = ++state.lockCalls === 1;
    const tx = {
      select: () => {
        let table: unknown;
        const chain = {
          from: (value: unknown) => { table = value; return chain; },
          where: () => chain,
          for: async () => state.exists ? [{ id: "application-id" }] : [],
          then: (resolve: (rows: object[]) => unknown) => Promise.resolve(table === attachments ? [{ id: "file-id" }] : state.exists ? [{ id: "application-id" }] : []).then(resolve),
        };
        return chain;
      },
      delete: (table: unknown) => ({ where: async () => { if (table === applications) { state.exists = false; state.deleted++; } } }),
    };
    const result = await work(tx);
    if (first && state.failCommit) { state.exists = !state.committedDespiteError; throw new Error("Commit failed"); }
    return result;
  },
}));
import { deleteReviewApplication } from "./review";
beforeEach(() => {
  vi.resetAllMocks(); state.exists = true; state.deleted = 0; state.lockCalls = 0; state.failCommit = false; state.committedDespiteError = false;
});
it("retains the DB row if storage quarantine fails and attempts recovery before reporting failure", async () => {
  mocks.quarantine.mockRejectedValue(new Error("Storage failure"));
  await expect(deleteReviewApplication("application-id")).rejects.toThrow("deletion failed");
  expect(state.exists).toBe(true); expect(state.deleted).toBe(0); expect(mocks.restore).toHaveBeenCalledWith([{ id: "file-id" }]); expect(mocks.cleanup).not.toHaveBeenCalled();
});
it("restores files after a rolled-back DB commit but never resurrects files after a lost successful commit acknowledgement", async () => {
  state.failCommit = true;
  await expect(deleteReviewApplication("application-id")).rejects.toThrow(); expect(state.exists).toBe(true); expect(mocks.restore).toHaveBeenCalledOnce();
  state.lockCalls = 0; state.committedDespiteError = true; mocks.restore.mockClear();
  await expect(deleteReviewApplication("application-id")).rejects.toThrow(); expect(state.exists).toBe(false); expect(mocks.restore).not.toHaveBeenCalled();
});
it("reports final storage cleanup failure without dangling DB references and allows an idempotent cleanup retry", async () => {
  mocks.cleanup.mockRejectedValueOnce(new Error("Cleanup failure"));
  await expect(deleteReviewApplication("application-id")).rejects.toThrow("Cleanup failure");
  expect(state.exists).toBe(false); expect(mocks.restore).not.toHaveBeenCalled();
  await deleteReviewApplication("application-id"); expect(state.deleted).toBe(1); expect(mocks.cleanup).toHaveBeenCalledTimes(2);
});
