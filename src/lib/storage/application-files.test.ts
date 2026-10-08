import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ download: vi.fn(), info: vi.fn(), signed: vi.fn(), list: vi.fn(), upload: vi.fn(), signUpload: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("./client", () => ({ getStorageClient: () => ({ from: () => ({ download: mocks.download, info: mocks.info, createSignedUrl: mocks.signed, list: mocks.list, upload: mocks.upload, createSignedUploadUrl: mocks.signUpload }) }) }));
import { reserveUpload, verifyUploadedFile } from "./application-files";
const session = { id: "00000000-0000-4000-8000-000000000001", jobSlug: "web-developer", issuedAt: 0, expiresAt: 7200000 };
const file = { id: "00000000-0000-4000-8000-000000000002", sessionId: session.id, jobSlug: session.jobSlug, slot: "cv", fileName: "cv.pdf", mime: "application/pdf", size: 100 };
beforeEach(() => {
  vi.resetAllMocks(); mocks.download.mockResolvedValue({ data: new Blob([JSON.stringify(file)]), error: null });
  mocks.info.mockResolvedValue({ data: { size: 100, contentType: "application/pdf" }, error: null });
  mocks.signed.mockResolvedValue({ data: { signedUrl: "https://storage.example.test/signed" }, error: null });
  mocks.list.mockResolvedValue({ data: [], error: null }); mocks.upload.mockResolvedValue({ error: null });
  mocks.signUpload.mockResolvedValue({ data: { signedUrl: "https://storage.example.test/upload" }, error: null });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("%PDF-1.7\n")));
});
it("rejects a token belonging to another session and never accepts client-controlled paths", async () => {
  mocks.download.mockResolvedValue({ data: new Blob([JSON.stringify({ ...file, sessionId: "00000000-0000-4000-8000-000000000003" })]), error: null });
  await expect(verifyUploadedFile(session, file.id, "cv", [])).rejects.toThrow("ownership");
  expect(mocks.info).not.toHaveBeenCalled();
});
it.each(["size", "mime", "slot", "signature"])("rejects actual uploaded %s mismatch", async (kind) => {
  if (kind === "size") mocks.info.mockResolvedValue({ data: { size: 101, contentType: file.mime }, error: null });
  if (kind === "mime") mocks.info.mockResolvedValue({ data: { size: 100, contentType: "text/html" }, error: null });
  if (kind === "signature") vi.mocked(fetch).mockResolvedValue(new Response("<html>bad</html>"));
  await expect(verifyUploadedFile(session, file.id, kind === "slot" ? "other" : "cv", [])).rejects.toThrow();
});
it("verifies actual bytes using a bounded range and the server-loaded reservation", async () => {
  expect(await verifyUploadedFile(session, file.id, "cv", [])).toEqual(file);
  expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: { Range: "bytes=0-511" }, cache: "no-store" }));
  expect(mocks.info).toHaveBeenCalledWith(`pending/${session.id}/${file.id}-cv.pdf`);
});
it("counts reservations before issuing signed URLs, including unfinished uploads", async () => {
  mocks.list.mockResolvedValue({ data: Array.from({ length: 8 }, (_, i) => ({ name: `${i}.json` })), error: null });
  await expect(reserveUpload(session, file, [])).rejects.toThrow("limit");
  expect(mocks.signUpload).not.toHaveBeenCalled();
  mocks.list.mockResolvedValue({ data: [], error: null });
  const result = await reserveUpload(session, { ...file, fileName: "../../cv.pdf" }, []);
  expect(result.uploadId).toMatch(/^[0-9a-f-]{36}$/);
  expect(mocks.signUpload).toHaveBeenCalledWith(expect.stringMatching(/^pending\/[0-9a-f-]{36}\/[0-9a-f-]{36}-cv\.pdf$/), { upsert: false });
});
it("retries a completed upload without overwriting it or consuming another slot", async () => {
  expect(await reserveUpload(session, { ...file, uploadId: file.id }, [])).toEqual({ uploadId: file.id, signedUrl: "", uploaded: true });
  expect(mocks.upload).not.toHaveBeenCalled(); expect(mocks.signUpload).not.toHaveBeenCalled();
});
