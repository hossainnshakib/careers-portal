import { beforeEach, expect, it, vi } from "vitest";
import { verifiedTestClaims } from "@/lib/auth/test-claims";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), findAdmin: vi.fn(), load: vi.fn(), render: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser, getClaims: () => verifiedTestClaims(mocks.getUser) } }) }));
vi.mock("@/db/queries/admins", () => ({ findAdmin: mocks.findAdmin }));
vi.mock("@/db/queries/admin-sessions", () => ({ hasCurrentAdminSession: async () => true }));
vi.mock("@/db/queries/pdf", () => ({ loadPdfProfile: mocks.load }));
vi.mock("@/lib/pdf/render", () => ({ renderProfilePdf: mocks.render }));
import { GET } from "./route";
const id = "00000000-0000-4000-8000-000000000001";
const invoke = (query = "", value = id) => GET(new Request(`http://localhost/api/admin/applications/${value}/pdf${query}`), { params: Promise.resolve({ id: value }) });
beforeEach(() => {
  vi.resetAllMocks(); mocks.getUser.mockResolvedValue({ data: { user: { id, email: "admin@example.com" } }, error: null }); mocks.findAdmin.mockResolvedValue({ userId: id });
  mocks.load.mockResolvedValue({ application: { reference: "APP-234567", fullName: "শ্রী ক্ষিতিশ\r\n" } }); mocks.render.mockResolvedValue(Buffer.from("%PDF-1.7"));
});
it.each(["anonymous", "non-admin"])("denies %s before loading any applicant data", async (kind) => {
  if (kind === "anonymous") mocks.getUser.mockResolvedValue({ data: { user: null }, error: null }); else mocks.findAdmin.mockResolvedValue(null);
  expect((await invoke()).status).toBe(403); expect(mocks.load).not.toHaveBeenCalled(); expect(mocks.render).not.toHaveBeenCalled();
});
it("defaults to excluding notes, accepts only explicit inclusion and returns safe private PDF headers", async () => {
  const response = await invoke(); expect(response.status).toBe(200); expect(mocks.load).toHaveBeenCalledWith(id, false);
  expect(response.headers.get("content-type")).toBe("application/pdf"); expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("content-disposition")).toContain("filename*=UTF-8''"); expect(response.headers.get("content-disposition")).not.toContain("\r");
  await invoke("?notes=1&tz=Asia%2FDhaka&locale=bn-BD"); expect(mocks.load).toHaveBeenLastCalledWith(id, true);
  for (const query of ["?notes=true", "?notes=1&notes=0", "?tz=invalid", "?other=value"]) expect((await invoke(query)).status).toBe(400);
});
