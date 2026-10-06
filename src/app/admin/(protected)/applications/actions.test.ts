import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), findAdmin: vi.fn(), status: vi.fn(), add: vi.fn(), remove: vi.fn(), deletion: vi.fn(), path: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock("@/db/queries/admins", () => ({ findAdmin: mocks.findAdmin }));
vi.mock("@/db/queries/review", () => ({ changeReviewStatus: mocks.status, addReviewNote: mocks.add, deleteReviewNote: mocks.remove, deleteReviewApplication: mocks.deletion }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.path }));
import { addNoteAction, changeStatusAction, deleteApplicationAction, deleteNoteAction } from "./actions";

const id = "00000000-0000-4000-8000-000000000001";
const admin = { id: "00000000-0000-4000-8000-000000000002", email: "admin@example.com" };
beforeEach(() => {
  vi.resetAllMocks(); mocks.getUser.mockResolvedValue({ data: { user: admin }, error: null }); mocks.findAdmin.mockResolvedValue({ userId: admin.id });
});
const calls = [
  ["status", () => changeStatusAction({ applicationId: id, status: "shortlisted" }), mocks.status],
  ["add note", () => addNoteAction({ applicationId: id, note: "Internal review" }), mocks.add],
  ["delete note", () => deleteNoteAction({ applicationId: id, noteId: id }), mocks.remove],
  ["delete application", () => deleteApplicationAction({ applicationId: id, confirmed: true }), mocks.deletion],
] as const;
for (const [name, invoke, mutation] of calls) {
  it.each(["anonymous", "non-admin"])(`${name} rejects %s before parsing or mutations`, async (kind) => {
    if (kind === "anonymous") mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    else mocks.findAdmin.mockResolvedValue(null);
    expect(await invoke()).toEqual({ ok: false, error: "Administrator access required." });
    for (const fn of [mocks.status, mocks.add, mocks.remove, mocks.deletion, mocks.path]) expect(fn).not.toHaveBeenCalled();
  });
  it(`${name} invalidates review views and hides infrastructure details`, async () => {
    expect((await invoke()).ok).toBe(true);
    expect(mocks.path).toHaveBeenCalledWith("/admin"); expect(mocks.path).toHaveBeenCalledWith("/admin/applications");
    mutation.mockRejectedValue(new Error("Sensitive database/storage detail"));
    const result = await invoke(); expect(result.ok).toBe(false); expect(JSON.stringify(result)).not.toContain("Sensitive");
  });
}
it("uses trusted author identity and rejects malformed payloads or missing confirmation", async () => {
  await addNoteAction({ applicationId: id, note: "  শ্রীময়ীর পর্যালোচনা  " });
  expect(mocks.add).toHaveBeenCalledWith(id, "শ্রীময়ীর পর্যালোচনা", { userId: admin.id, email: admin.email });
  expect((await addNoteAction({ applicationId: id, note: "text", adminUserId: "attacker" })).ok).toBe(false);
  expect((await changeStatusAction({ applicationId: id, status: "invalid" })).ok).toBe(false);
  expect((await deleteNoteAction({ applicationId: id, noteId: "invalid" })).ok).toBe(false);
  expect((await deleteApplicationAction({ applicationId: id, confirmed: false })).ok).toBe(false);
  expect(mocks.deletion).not.toHaveBeenCalled();
});
