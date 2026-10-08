import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ listBuckets: vi.fn(), createBucket: vi.fn(), updateBucket: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("./client", () => ({ getStorageClient: () => mocks }));
import { bucketDefinitions, ensureBuckets } from "./ensure-buckets";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.listBuckets.mockResolvedValue({ data: [], error: null });
  mocks.createBucket.mockResolvedValue({ error: null });
  mocks.updateBucket.mockResolvedValue({ error: null });
});
it("creates bounded private candidate and public logo buckets with explicit MIME allowlists", async () => {
  await ensureBuckets();
  expect(mocks.createBucket).toHaveBeenCalledWith("applications", expect.objectContaining({
    public: false, fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: expect.arrayContaining(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png", "image/webp", "application/zip", "application/json"]),
  }));
  expect(mocks.createBucket).toHaveBeenCalledWith("brand-assets", {
    id: "brand-assets", public: true, fileSizeLimit: 1024 * 1024,
    allowedMimeTypes: ["image/svg+xml", "image/png", "image/webp"],
  });
});
it("updates existing bucket limits without changing visibility", async () => {
  mocks.listBuckets.mockResolvedValue({ data: bucketDefinitions.map(({ id, public: visibility }) => ({ id, public: visibility })), error: null });
  await ensureBuckets();
  expect(mocks.updateBucket).toHaveBeenCalledTimes(2);
  expect(mocks.createBucket).not.toHaveBeenCalled();
});
it("refuses a public candidate bucket instead of silently correcting visibility", async () => {
  mocks.listBuckets.mockResolvedValue({ data: [{ id: "applications", public: true }], error: null });
  await expect(ensureBuckets()).rejects.toThrow("visibility");
  expect(mocks.updateBucket).not.toHaveBeenCalled();
});
it.each(["list", "write"])("fails closed on bucket %s failures", async (kind) => {
  if (kind === "list") mocks.listBuckets.mockResolvedValue({ data: null, error: {} });
  else mocks.createBucket.mockResolvedValue({ error: {} });
  await expect(ensureBuckets()).rejects.toThrow();
});
