import { beforeEach, expect, it, vi } from "vitest";
import { verifiedTestClaims } from "@/lib/auth/test-claims";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), findAdmin: vi.fn(), authorize: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser, getClaims: () => verifiedTestClaims(mocks.getUser) } }) }));
vi.mock("@/db/queries/admins", () => ({ findAdmin: mocks.findAdmin }));
vi.mock("@/db/queries/admin-sessions", () => ({ hasCurrentAdminSession: async () => true }));
vi.mock("@/db/queries/review", () => ({ authorizeReviewDownload: mocks.authorize }));
import { GET } from "./route";
const id = "00000000-0000-4000-8000-000000000001";
const invoke = (value = id) => GET(new Request(`http://localhost/api/admin/attachments/${value}`), { params: Promise.resolve({ id: value }) });
beforeEach(() => {
  vi.resetAllMocks(); mocks.getUser.mockResolvedValue({ data: { user: { id, email: "admin@example.com" } }, error: null }); mocks.findAdmin.mockResolvedValue({ userId: id });
});
it.each(["anonymous", "non-admin"])("rejects %s without reading an attachment or producing a signed URL", async (kind) => {
  if (kind === "anonymous") mocks.getUser.mockResolvedValue({ data: { user: null }, error: null }); else mocks.findAdmin.mockResolvedValue(null);
  const response = await invoke(); expect(response.status).toBe(403); expect(response.headers.has("location")).toBe(false); expect(mocks.authorize).not.toHaveBeenCalled();
});
it("returns an admin-only, no-store redirect and validates IDs before querying", async () => {
  expect((await invoke("invalid")).status).toBe(404); expect(mocks.authorize).not.toHaveBeenCalled();
  mocks.authorize.mockResolvedValue("https://storage.example.test/signed-fixture");
  const response = await invoke(); expect(response.status).toBe(302); expect(response.headers.get("location")).toBe("https://storage.example.test/signed-fixture"); expect(response.headers.get("cache-control")).toContain("no-store");
});
it("does not expose missing records or infrastructure details", async () => {
  mocks.authorize.mockResolvedValue(null); expect((await invoke()).status).toBe(404);
  mocks.authorize.mockRejectedValue(new Error("Sensitive storage credentials")); const response = await invoke(); expect(response.status).toBe(503); expect(await response.text()).not.toContain("Sensitive");
});
