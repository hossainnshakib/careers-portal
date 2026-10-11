import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ turnstile: vi.fn(), session: vi.fn(), load: vi.fn(), existing: vi.fn(), insert: vi.fn(), verifyFile: vi.fn(), move: vi.fn(), restore: vi.fn(), redirect: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: mocks.turnstile }));
vi.mock("@/lib/upload-session", () => ({ verifyUploadSession: mocks.session }));
vi.mock("@/db/queries/public-jobs", () => ({ loadApplicationJob: mocks.load }));
vi.mock("@/db/queries/applications", () => ({ withUploadSession: async (_id: string, work: (tx: object) => Promise<unknown>) => work({}), existingSessionApplication: mocks.existing, insertApplication: mocks.insert }));
vi.mock("@/lib/storage/application-files", () => ({ verifyUploadedFile: mocks.verifyFile, moveApplicationFile: mocks.move, restoreApplicationFiles: mocks.restore }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
import { submitApplication } from "./actions";
const id = "00000000-0000-4000-8000-000000000001";
const fileId = "00000000-0000-4000-8000-000000000002";
const question = { id, label: "Why?", type: "long_text", required: true, options: null, config: null, helpText: null, section: "professional", sortOrder: 0 };
const definition = { job: { status: "open", cvRequired: true, deadlineAt: null }, questions: [question], brands: [{ brand: { status: "active" } }] };
const input = { jobSlug: "web-developer", sessionToken: "session", turnstileToken: "challenge", honeypot: "", contact: { fullName: "শ্রী ক্ষিতিশ", email: "candidate@example.com", phone: "01700000000", location: "Dhaka" }, consent: true, cv: [fileId], answers: { [id]: "Relevant experience" } };
beforeEach(() => {
  vi.resetAllMocks(); mocks.turnstile.mockResolvedValue(true); mocks.session.mockReturnValue({ id: "session-id", issuedAt: Date.now() - 10000 });
  mocks.load.mockResolvedValue(definition); mocks.existing.mockResolvedValue(undefined); mocks.insert.mockResolvedValue("APP-234567");
  mocks.verifyFile.mockResolvedValue({ id: fileId, slot: "cv" });
  mocks.redirect.mockImplementation(() => { throw new Error("redirect-success"); });
});
it.each(["closed", "draft"])("rejects %s jobs before touching files", async (status) => {
  mocks.load.mockResolvedValue({ ...definition, job: { ...definition.job, status } });
  expect((await submitApplication(input)).ok).toBe(false); expect(mocks.verifyFile).not.toHaveBeenCalled(); expect(mocks.insert).not.toHaveBeenCalled();
});
it.each(["unknown question", "missing answer", "path instead of token", "duplicate file", "honeypot", "missing consent"])("rejects %s", async (kind) => {
  const changed = structuredClone(input);
  if (kind === "unknown question") changed.answers[fileId as typeof id] = "Injected";
  if (kind === "missing answer") changed.answers = {} as typeof input.answers;
  if (kind === "path instead of token") changed.cv = ["pending/other-session/cv.pdf"];
  if (kind === "duplicate file") changed.cv = [fileId, fileId];
  if (kind === "honeypot") changed.honeypot = "bot";
  if (kind === "missing consent") changed.consent = false;
  expect((await submitApplication(changed)).ok).toBe(false); expect(mocks.insert).not.toHaveBeenCalled();
});
it.each(["wrong session", "wrong MIME", "wrong size", "bad content"])("rejects storage verification failure: %s", async () => {
  mocks.verifyFile.mockRejectedValue(new Error("Sensitive storage detail"));
  const result = await submitApplication(input); expect(result.ok).toBe(false); expect(JSON.stringify(result)).not.toContain("Sensitive"); expect(mocks.move).not.toHaveBeenCalled(); expect(mocks.insert).not.toHaveBeenCalled();
});
it.each(["expired session", "failed Turnstile", "minimum fill time"])("rejects %s", async (kind) => {
  if (kind === "expired session") mocks.session.mockImplementation(() => { throw new Error("Expired"); });
  if (kind === "failed Turnstile") mocks.turnstile.mockResolvedValue(false);
  if (kind === "minimum fill time") mocks.session.mockReturnValue({ id: "session-id", issuedAt: Date.now() });
  expect((await submitApplication(input)).ok).toBe(false); expect(mocks.load).not.toHaveBeenCalled(); expect(mocks.insert).not.toHaveBeenCalled();
});
it("persists Bengali contact details and DB-validated answers, then redirects outside the error catch", async () => {
  await expect(submitApplication(input)).rejects.toThrow("redirect-success");
  expect(mocks.insert).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ contact: input.contact, consent: true, answers: input.answers }));
  expect(mocks.redirect).toHaveBeenCalledWith("/applied/APP-234567"); expect(mocks.restore).not.toHaveBeenCalled();
});
it("restores finalized files on persistence failure and reuses an existing session application", async () => {
  mocks.insert.mockRejectedValue(new Error("Sensitive database detail"));
  const result = await submitApplication(input); expect(result.ok).toBe(false); expect(JSON.stringify(result)).not.toContain("Sensitive");
  expect(mocks.restore).toHaveBeenCalledWith([{ id: fileId, slot: "cv" }]);
  mocks.existing.mockResolvedValue({ reference: "APP-234567" }); mocks.move.mockClear();
  await expect(submitApplication(input)).rejects.toThrow("redirect-success"); expect(mocks.move).not.toHaveBeenCalled();
});
it("does not restore files if the transaction committed but its acknowledgement was lost", async () => {
  mocks.insert.mockRejectedValue(new Error("Commit acknowledgement lost"));
  mocks.existing.mockResolvedValueOnce(undefined).mockResolvedValueOnce({ reference: "APP-234567" });
  await expect(submitApplication(input)).rejects.toThrow("redirect-success");
  expect(mocks.restore).not.toHaveBeenCalled();
});
