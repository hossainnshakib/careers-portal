import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  findAdmin: vi.fn(),
  save: vi.fn(),
  mutate: vi.fn(),
  load: vi.fn(),
  tag: vi.fn(),
  path: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/db/queries/admins", () => ({ findAdmin: mocks.findAdmin }));
vi.mock("@/db/queries/jobs", () => ({
  saveJob: mocks.save,
  mutateJob: mocks.mutate,
  loadJob: mocks.load,
}));
vi.mock("next/cache", () => ({ revalidateTag: mocks.tag, revalidatePath: mocks.path }));
import { saveJobAction, jobCommandAction, copyJobQuestionsAction } from "./actions";
import { jobInput } from "@/lib/validation/jobs";

const id = "10000000-0000-4000-8000-000000000001";
const input = {
  id: null,
  title: "Test job",
  slug: "test-job",
  departmentId: id,
  brandIds: [id],
  primaryBrandId: id,
  employmentType: "full_time",
  workMode: "remote",
  experienceLevel: null,
  locationText: "",
  deadlineAt: null,
  cvRequired: true,
  summary: "",
  descriptionMd: "",
  responsibilitiesMd: "",
  requirementsMd: "",
  questions: [],
  intent: "save",
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "admin", email: "test@example.com" } },
    error: null,
  });
  mocks.findAdmin.mockResolvedValue({ userId: "admin" });
  mocks.save.mockResolvedValue({ id, slug: "new", previousSlug: "old" });
  mocks.mutate.mockResolvedValue({ id, slug: "new", previousSlug: "old" });
});
for (const [name, invoke] of [
  ["save", () => saveJobAction(input)],
  ["command", () => jobCommandAction({ id, command: "close" })],
  ["copy", () => copyJobQuestionsAction({ sourceJobId: id })],
] as const) {
  it.each(["anonymous", "non-admin"])(`${name} rejects %s before DB reads/writes`, async (kind) => {
    if (kind === "anonymous")
      mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    else mocks.findAdmin.mockResolvedValue(null);
    expect(await invoke()).toEqual({ ok: false, error: "Administrator access required." });
    for (const fn of [mocks.save, mocks.mutate, mocks.load, mocks.tag])
      expect(fn).not.toHaveBeenCalled();
  });
}
it("validates before mutation and reloads job definitions for copy", async () => {
  expect((await saveJobAction({ ...input, primaryBrandId: "invalid" })).ok).toBe(false);
  expect(mocks.save).not.toHaveBeenCalled();
  expect((await jobCommandAction({ id, command: "hack" })).ok).toBe(false);
  expect(mocks.mutate).not.toHaveBeenCalled();
  expect((await copyJobQuestionsAction({ sourceJobId: id, questions: [] })).ok).toBe(false);
  expect(mocks.load).not.toHaveBeenCalled();
});
it("invalidates jobs/filter counts and old/new detail slugs after saves/commands", async () => {
  await saveJobAction(input);
  expect(mocks.save).toHaveBeenCalledWith(jobInput.parse(input));
  expect(mocks.tag.mock.calls.map(([tag]) => tag)).toEqual([
    "jobs",
    "brands",
    "departments",
    "job:new",
    "job:old",
  ]);
  mocks.tag.mockClear();
  await jobCommandAction({ id, command: "close" });
  expect(mocks.tag).toHaveBeenCalledWith("job:old");
  expect(mocks.path).toHaveBeenCalledWith("/admin/jobs");
});
it("copies only active questions into independently editable IDs without a DB mutation", async () => {
  const q = {
    id,
    label: "Question",
    type: "short_text",
    required: false,
    section: "professional",
    sortOrder: 0,
    config: null,
    options: null,
    helpText: null,
    archivedAt: null,
  };
  mocks.load.mockResolvedValue({ questions: [q, { ...q, archivedAt: new Date() }] });
  const result = await copyJobQuestionsAction({ sourceJobId: id });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("Copy failed");
  expect(result.data).toHaveLength(1);
  expect(result.data[0].id).not.toBe(id);
  result.data[0].label = "Edited";
  expect(q.label).toBe("Question");
  expect(mocks.save).not.toHaveBeenCalled();
  expect(mocks.tag).not.toHaveBeenCalled();
});
it("returns generic failure for immutable slug/DB failures", async () => {
  mocks.save.mockRejectedValue(new Error("Sensitive DB detail"));
  const result = await saveJobAction(input);
  expect(result.ok).toBe(false);
  expect(JSON.stringify(result)).not.toContain("Sensitive");
  expect(mocks.tag).not.toHaveBeenCalled();
});
it.each(["close", "reopen", "duplicate", "delete"])(
  "%s invalidates list/counts and both affected slug tags",
  async (command) => {
    expect((await jobCommandAction({ id, command })).ok).toBe(true);
    expect(mocks.mutate).toHaveBeenCalledWith(id, command);
    expect(mocks.tag.mock.calls.map(([tag]) => tag)).toEqual([
      "jobs",
      "brands",
      "departments",
      "job:new",
      "job:old",
    ]);
  },
);
