import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ turnstile: vi.fn(), create: vi.fn(), verify: vi.fn(), existing: vi.fn(), load: vi.fn(), reserve: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: mocks.turnstile }));
vi.mock("@/lib/upload-session", () => ({ createUploadSession: mocks.create, verifyUploadSession: mocks.verify }));
vi.mock("@/db/queries/public-jobs", () => ({ loadApplicationJob: mocks.load }));
vi.mock("@/db/queries/applications", () => ({ withUploadSession: async (_id: string, work: (tx: object) => Promise<unknown>) => work({}), existingSessionApplication: mocks.existing }));
vi.mock("@/lib/storage/application-files", () => ({ reserveUpload: mocks.reserve }));
import { POST } from "./route";
const request = (data: unknown) => new Request("http://localhost/api/upload-url", { method: "POST", body: JSON.stringify(data) });
const input = { jobSlug: "web-developer", sessionToken: "signed-session", slot: "cv", fileName: "cv.pdf", mime: "application/pdf", size: 100 };
beforeEach(() => {
  vi.resetAllMocks(); mocks.turnstile.mockResolvedValue(true); mocks.create.mockReturnValue({ token: "signed-session" }); mocks.verify.mockReturnValue({ id: "session-id" });
  mocks.load.mockResolvedValue({ job: { status: "open", deadlineAt: null }, brands: [{ brand: { status: "active" } }], questions: [] });
  mocks.reserve.mockResolvedValue({ uploadId: "opaque-id", signedUrl: "https://storage.example.test/upload" });
});
it("initializes a session only after Turnstile and returns no-store responses", async () => {
  const response = await POST(request({ jobSlug: "web-developer", turnstileToken: "challenge" }));
  expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toContain("no-store");
  expect(mocks.turnstile).toHaveBeenCalledWith("challenge"); expect(mocks.reserve).not.toHaveBeenCalled();
});
it.each(["failed Turnstile", "expired session", "submitted session", "closed job", "reservation limit"])("rejects %s without exposing infrastructure details", async (kind) => {
  if (kind === "failed Turnstile") mocks.turnstile.mockResolvedValue(false);
  if (kind === "expired session") mocks.verify.mockImplementation(() => { throw new Error("Sensitive token detail"); });
  if (kind === "submitted session") mocks.existing.mockResolvedValue({ reference: "APP-234567" });
  if (kind === "closed job") mocks.load.mockResolvedValue({ job: { status: "closed" } });
  if (kind === "reservation limit") mocks.reserve.mockRejectedValue(new Error("Sensitive storage detail"));
  const response = await POST(request(kind === "failed Turnstile" ? { jobSlug: "web-developer", turnstileToken: "challenge" } : input));
  expect(response.status).toBe(400); expect(await response.text()).not.toContain("Sensitive");
});
it("rejects oversized bodies and unknown keys before authorization", async () => {
  expect((await POST(request({ padding: "x".repeat(8193) }))).status).toBe(413);
  expect((await POST(request({ ...input, path: "applications/other/cv.pdf" }))).status).toBe(400);
  expect(mocks.verify).not.toHaveBeenCalled(); expect(mocks.reserve).not.toHaveBeenCalled();
});
