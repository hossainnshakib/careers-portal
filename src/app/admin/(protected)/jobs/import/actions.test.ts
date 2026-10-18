import { beforeEach, expect, it, vi } from "vitest";
import data from "../../../../../../public/imports/job-04.json";
import { importJobSchema, type ImportCatalog } from "@/lib/jobs/import";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), claims: vi.fn(), allowed: vi.fn(), session: vi.fn(), catalog: vi.fn(), save: vi.fn(), tag: vi.fn(), path: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser, getClaims: mocks.claims } }) }));
vi.mock("@/db/queries/admins", () => ({ findAdmin: mocks.allowed }));
vi.mock("@/db/queries/admin-sessions", () => ({ hasCurrentAdminSession: mocks.session }));
vi.mock("@/db/queries/job-import", () => ({ loadImportCatalog: mocks.catalog }));
vi.mock("@/db/queries/jobs", () => ({ saveJob: mocks.save }));
vi.mock("next/cache", () => ({ revalidateTag: mocks.tag, revalidatePath: mocks.path }));
import { importJobAction, previewJobImportAction } from "./actions";
const raw = importJobSchema.parse(data.jobs[0]);
const uuid = (i: number) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const catalog: ImportCatalog = {
  departments: [{ id: uuid(1), slug: raw.department, isActive: true }],
  brands: raw.brands.map((slug, i) => ({ id: uuid(10 + i), slug, status: "active" })),
  options: Object.entries(raw.options).flatMap(([group, slugs], i) => slugs.map((slug, j) => ({ id: uuid(20 + i * 10 + j), slug, group, isActive: true }))),
  jobs: [],
};
const text = JSON.stringify(data);
const request = { text, index: 0, confirmed: true };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "admin", email: "test@example.com" } }, error: null });
  mocks.allowed.mockResolvedValue({ userId: "admin" });
  mocks.claims.mockResolvedValue({ data: { claims: { sub: "admin", aal: "aal2", session_id: uuid(1) } }, error: null });
  mocks.session.mockResolvedValue(true);
  mocks.catalog.mockResolvedValue(structuredClone(catalog));
  mocks.save.mockResolvedValue({ id: uuid(99), slug: raw.slug, previousSlug: raw.slug });
});
for (const [name, invoke] of [["preview", () => previewJobImportAction(text)], ["execute", () => importJobAction(request)]] as const) {
  it.each(["anonymous", "non-admin", "aal1", "expired session"])(`${name} rejects %s before catalog access`, async (kind) => {
    if (kind === "anonymous") mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    if (kind === "non-admin") mocks.allowed.mockResolvedValue(null);
    if (kind === "aal1") mocks.claims.mockResolvedValue({ data: { claims: { sub: "admin", aal: "aal1" } }, error: null });
    if (kind === "expired session") mocks.session.mockResolvedValue(false);
    expect(await invoke()).toEqual({ ok: false, error: "Administrator access required." });
    expect(mocks.catalog).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });
}
it("preview validates and reads the catalog but never saves", async () => {
  const result = await previewJobImportAction(text);
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.data[0].outcome).toBe("create");
  expect(mocks.save).not.toHaveBeenCalled();
  expect(mocks.tag).not.toHaveBeenCalled();
  expect((await previewJobImportAction("{")).ok).toBe(false);
});
it("requires explicit confirmation, valid index and no file errors before saving", async () => {
  for (const input of [{ ...request, confirmed: false }, { ...request, index: 8 }, { ...request, text: "{}" }])
    expect((await importJobAction(input)).ok).toBe(false);
  const invalid = { ...raw, primaryBrand: "missing" };
  expect((await importJobAction({ ...request, text: JSON.stringify({ version: 1, jobs: [raw, invalid] }) })).ok).toBe(false);
  expect(mocks.save).not.toHaveBeenCalled();
});
it("saves through the existing create-only service, revalidating public caches", async () => {
  expect(await importJobAction(request)).toEqual({ ok: true, data: { outcome: "created", slug: raw.slug } });
  expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ id: null, intent: "publish", questions: expect.any(Array) }), "skip-existing");
  expect(mocks.tag.mock.calls.map(([tag]) => tag)).toEqual(["jobs", "brands", "departments", `job:${raw.slug}`]);
  expect(mocks.path).toHaveBeenCalledWith("/admin/jobs");
});
it("handles a multi-job batch with distinct draft/published intents", async () => {
  const batch = JSON.stringify({ version: 1, jobs: [raw, { ...raw, title: "Second job", slug: "second-job", status: "draft" }] });
  expect((await importJobAction({ text: batch, index: 0, confirmed: true })).ok).toBe(true);
  expect((await importJobAction({ text: batch, index: 1, confirmed: true })).ok).toBe(true);
  expect(mocks.save.mock.calls.map(([input]) => input.intent)).toEqual(["publish", "save"]);
});
it("skips duplicates both from the latest catalog and under the transactional save lock", async () => {
  mocks.catalog.mockResolvedValue({ ...catalog, jobs: [{ slug: raw.slug, title: raw.title }] });
  expect(await importJobAction(request)).toEqual({ ok: true, data: { outcome: "skipped", slug: raw.slug } });
  expect(mocks.save).not.toHaveBeenCalled();
  mocks.catalog.mockResolvedValue(catalog);
  mocks.save.mockResolvedValue(null);
  expect(await importJobAction(request)).toEqual({ ok: true, data: { outcome: "skipped", slug: raw.slug } });
  expect(mocks.tag).not.toHaveBeenCalled();
});
it("reports a generic failure without leaking DB details; retry skips a committed job", async () => {
  mocks.save.mockRejectedValueOnce(new Error("PRIVATE_PROVIDER_DETAIL"));
  const result = await importJobAction(request);
  expect(result.ok).toBe(false);
  expect(JSON.stringify(result)).not.toContain("PRIVATE_PROVIDER_DETAIL");
  mocks.catalog.mockResolvedValue({ ...catalog, jobs: [{ slug: raw.slug, title: raw.title }] });
  expect(await importJobAction(request)).toEqual({ ok: true, data: { outcome: "skipped", slug: raw.slug } });
});
it("reports a committed save separately from cache invalidation failure", async () => {
  mocks.tag.mockImplementation(() => { throw new Error("PRIVATE_CACHE_DETAIL"); });
  const result = await importJobAction(request);
  expect(result.ok).toBe(true);
  if (result.ok) { expect(result.data.outcome).toBe("created"); expect(result.data.warning).toContain("cache refresh failed"); }
  expect(JSON.stringify(result)).not.toContain("PRIVATE_CACHE_DETAIL");
});
