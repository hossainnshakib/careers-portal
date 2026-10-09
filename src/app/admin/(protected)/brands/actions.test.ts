import { beforeEach, describe, expect, it, vi } from "vitest";
import { verifiedTestClaims } from "@/lib/auth/test-claims";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  findAdmin: vi.fn(),
  save: vi.fn(),
  reorder: vi.fn(),
  find: vi.fn(),
  setLogo: vi.fn(),
  slugs: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  tag: vi.fn(),
  path: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser, getClaims: () => verifiedTestClaims(mocks.getUser) } }),
}));
vi.mock("@/db/queries/admins", () => ({ findAdmin: mocks.findAdmin }));
vi.mock("@/db/queries/admin-sessions", () => ({ hasCurrentAdminSession: async () => true }));
vi.mock("@/db/queries/brands", () => ({
  saveBrand: mocks.save,
  reorderBrand: mocks.reorder,
  findBrand: mocks.find,
  setBrandLogo: mocks.setLogo,
  brandJobSlugs: mocks.slugs,
}));
vi.mock("@/lib/storage/brand-logos", () => ({
  uploadBrandLogo: mocks.upload,
  removeBrandLogo: mocks.remove,
}));
vi.mock("next/cache", () => ({ revalidateTag: mocks.tag, revalidatePath: mocks.path }));
import { saveBrandAction, reorderBrandAction, uploadBrandLogoAction } from "./actions";

const id = "10000000-0000-4000-8000-000000000001";
const input = {
  id: null,
  name: "Brand",
  slug: "brand",
  sector: "media",
  description: "Description",
  website: "https://example.com",
  accentColor: "#123456",
  status: "active",
};
function uploadForm() {
  const form = new FormData();
  form.set("brandId", id);
  form.set(
    "file",
    new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'], "logo.svg", { type: "image/svg+xml" }),
  );
  return form;
}
describe("brand actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "admin", email: "test@example.com" } },
      error: null,
    });
    mocks.findAdmin.mockResolvedValue({ userId: "admin" });
    mocks.save.mockResolvedValue({ id });
    mocks.find.mockResolvedValue({ id });
    mocks.slugs.mockResolvedValue([{ slug: "designer" }]);
    mocks.upload.mockResolvedValue({ path: "test-path", url: "https://example.com/logo.svg" });
  });
  for (const [name, invoke] of [
    ["save", () => saveBrandAction(input)],
    ["reorder", () => reorderBrandAction({ id, direction: "up" })],
    ["upload", () => uploadBrandLogoAction(uploadForm())],
  ] as const) {
    it.each(["anonymous", "non-admin"])(
      `${name} rejects %s before DB/Storage access`,
      async (kind) => {
        if (kind === "anonymous")
          mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
        else mocks.findAdmin.mockResolvedValue(null);
        expect(await invoke()).toEqual({ ok: false, error: "Administrator access required." });
        for (const fn of [
          mocks.save,
          mocks.reorder,
          mocks.find,
          mocks.upload,
          mocks.setLogo,
          mocks.tag,
        ])
          expect(fn).not.toHaveBeenCalled();
      },
    );
    it(`${name} invalidates brands, jobs and affected detail tags`, async () => {
      expect((await invoke()).ok).toBe(true);
      expect(mocks.tag.mock.calls.map(([tag]) => tag)).toEqual(["brands", "jobs", "job:designer"]);
      expect(mocks.path).toHaveBeenCalledWith("/admin/brands");
    });
  }
  it("rejects malformed fields and client-supplied logo URLs", async () => {
    for (const bad of [
      { ...input, name: " " },
      { ...input, slug: "UPPER" },
      { ...input, sector: "unknown" },
      { ...input, accentColor: "red" },
      { ...input, website: "javascript:alert(1)" },
      { ...input, logoUrl: "https://attacker.example/file.svg" },
    ])
      expect((await saveBrandAction(bad)).ok).toBe(false);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("rejects malformed upload input and nonexistent brands", async () => {
    const form = uploadForm();
    form.set("brandId", "invalid");
    expect((await uploadBrandLogoAction(form)).ok).toBe(false);
    expect(mocks.upload).not.toHaveBeenCalled();
    const duplicate = uploadForm();
    duplicate.append("brandId", id);
    expect((await uploadBrandLogoAction(duplicate)).ok).toBe(false);
    mocks.find.mockResolvedValue(null);
    expect((await uploadBrandLogoAction(uploadForm())).ok).toBe(false);
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("removes newly uploaded object if DB logo write fails", async () => {
    mocks.setLogo.mockRejectedValue(new Error("Sensitive DB details"));
    const result = await uploadBrandLogoAction(uploadForm());
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("Sensitive");
    expect(mocks.remove).toHaveBeenCalledWith("test-path");
    expect(mocks.tag).not.toHaveBeenCalled();
  });
});
