import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  findAdmin: vi.fn(),
  save: vi.fn(),
  reorder: vi.fn(),
  slugs: vi.fn(),
  tag: vi.fn(),
  path: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/db/queries/admins", () => ({ findAdmin: mocks.findAdmin }));
vi.mock("@/db/queries/departments", () => ({
  saveDepartment: mocks.save,
  reorderDepartment: mocks.reorder,
  departmentJobSlugs: mocks.slugs,
}));
vi.mock("next/cache", () => ({ revalidateTag: mocks.tag, revalidatePath: mocks.path }));
import { saveDepartmentAction, reorderDepartmentAction } from "./actions";

const id = "10000000-0000-4000-8000-000000000001";
const input = { id: null, name: "Design", slug: "design", isActive: true };
describe("department actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "admin", email: "test@example.com" } },
      error: null,
    });
    mocks.findAdmin.mockResolvedValue({ userId: "admin" });
    mocks.save.mockResolvedValue({ id });
    mocks.slugs.mockResolvedValue([{ slug: "designer" }]);
  });
  for (const [name, invoke] of [
    ["save", () => saveDepartmentAction(input)],
    ["reorder", () => reorderDepartmentAction({ id, direction: "up" })],
  ] as const) {
    it.each(["anonymous", "non-admin"])(
      `${name} rejects %s before data mutation or revalidation`,
      async (kind) => {
        if (kind === "anonymous")
          mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
        else mocks.findAdmin.mockResolvedValue(null);
        expect(await invoke()).toEqual({ ok: false, error: "Administrator access required." });
        expect(mocks.save).not.toHaveBeenCalled();
        expect(mocks.reorder).not.toHaveBeenCalled();
        expect(mocks.tag).not.toHaveBeenCalled();
      },
    );
    it(`${name} invalidates departments, jobs and affected details`, async () => {
      expect((await invoke()).ok).toBe(true);
      expect(mocks.tag.mock.calls.map(([tag]) => tag)).toEqual([
        "departments",
        "jobs",
        "job:designer",
      ]);
      expect(mocks.path).toHaveBeenCalledWith("/admin/departments");
    });
  }
  it("validates every field and rejects unknown keys before DB access", async () => {
    for (const bad of [
      { ...input, name: " " },
      { ...input, slug: "UPPER" },
      { ...input, id: "invalid" },
      { ...input, isActive: "true" },
      { ...input, role: "admin" },
    ])
      expect((await saveDepartmentAction(bad)).ok).toBe(false);
    expect(mocks.save).not.toHaveBeenCalled();
    expect((await reorderDepartmentAction({ id, direction: "sideways" })).ok).toBe(false);
    expect(mocks.reorder).not.toHaveBeenCalled();
  });
  it("passes normalized create and edit inputs to DB queries", async () => {
    await saveDepartmentAction({ ...input, name: " Design " });
    expect(mocks.save).toHaveBeenCalledWith(input);
    await saveDepartmentAction({ ...input, id, isActive: false });
    expect(mocks.save).toHaveBeenLastCalledWith({ ...input, id, isActive: false });
  });
  it("returns generic DB failure without invalidating", async () => {
    mocks.save.mockRejectedValue(new Error("sensitive database detail"));
    const result = await saveDepartmentAction(input);
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("sensitive");
    expect(mocks.tag).not.toHaveBeenCalled();
  });
});
