import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { closeDb } from "@/db";
import { requireDevTarget } from "@/db/seed/require-dev";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { addAdmin } from "./admins";
import { removeTestFixture } from "./test-fixtures";
import { addReviewPaginationFixtures, createReviewTestApplication, reviewTestApplicationIds, verifyReviewTestRows } from "./review-test-fixture";
import { removeReviewTestFiles, reviewTestFilesAbsent } from "@/lib/storage/review-test-files";
import { addReviewNote, authorizeReviewDownload, changeReviewStatus, deleteReviewApplication, deleteReviewNote, listReviewApplications, loadReviewProfile } from "./review";
import { reviewFilters } from "@/lib/validation/review";

describe.skipIf(process.env.RUN_SUPABASE_TESTS !== "1")("dev-only live review transactions and private attachments", () => {
  const prefix = `e2e-${randomUUID().replaceAll("-", "")}-`;
  const email = `${prefix}admin@example.com`;
  let userId: string | undefined;
  let fixture: Awaited<ReturnType<typeof createReviewTestApplication>>;
  beforeAll(async () => {
    requireDevTarget();
    const created = await createSupabaseAdminClient().auth.admin.createUser({ email, password: `${randomUUID()}Aa9!`, email_confirm: true });
    if (created.error || !created.data.user) throw new Error("Review live account setup failed");
    userId = created.data.user.id; await addAdmin(userId, email);
    fixture = await createReviewTestApplication(prefix);
  }, 60000);
  afterAll(async () => {
    try {
      const ids = await reviewTestApplicationIds(prefix);
      await removeReviewTestFiles([...new Set([...ids, ...(fixture ? [fixture.applicationId, fixture.previousId] : [])])]);
      await removeTestFixture(userId ?? randomUUID(), prefix);
      if (userId && (await createSupabaseAdminClient().auth.admin.deleteUser(userId)).error) throw new Error("Review live account cleanup failed");
    } finally { await closeDb(); }
  }, 60000);
  it("filters brand/status/name/email and inclusive timezone date ranges without duplicate rows", async () => {
    const filters = reviewFilters.parse({ brand: fixture.brandId, job: fixture.jobId, status: "new", q: fixture.email.toUpperCase() });
    const result = await listReviewApplications(filters); expect(result.total).toBe(1); expect(result.rows[0].id).toBe(fixture.applicationId);
    const bengali = await listReviewApplications(reviewFilters.parse({ job: fixture.jobId, q: "শ্রী", sort: "oldest" }));
    expect(bengali.total).toBe(2); expect(bengali.rows[0].id).toBe(fixture.previousId);
    const submitted = (await loadReviewProfile(fixture.applicationId))!.application.submittedAt;
    const today = submitted.toISOString().slice(0, 10);
    expect((await listReviewApplications(reviewFilters.parse({ job: fixture.jobId, from: today, to: today, tz: "UTC" }))).total).toBe(1);
    const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(submitted);
    const localDate = ["year", "month", "day"].map((type) => parts.find((part) => part.type === type)!.value).join("-");
    expect((await listReviewApplications(reviewFilters.parse({ job: fixture.jobId, from: localDate, to: localDate, tz: "Asia/Dhaka" }))).total).toBe(1);
    for (const q of ["%", "_", "' OR 1=1 --"]) expect((await listReviewApplications(reviewFilters.parse({ job: fixture.jobId, q }))).total).toBe(0);
  }, 60000);
  it("changes status atomically with actor, from/to and matching timestamps, and skips no-op events", async () => {
    await changeReviewStatus(fixture.applicationId, "shortlisted", userId!);
    await changeReviewStatus(fixture.applicationId, "shortlisted", userId!);
    const profile = await loadReviewProfile(fixture.applicationId);
    expect(profile?.application.status).toBe("shortlisted"); expect(profile?.events.length).toBe(2);
    const event = profile?.events.find((event) => event.toStatus === "shortlisted");
    expect(event?.fromStatus).toBe("new"); expect(event?.adminUserId).toBe(userId);
    expect(event?.createdAt.toISOString()).toBe(profile?.application.statusChangedAt.toISOString());
  }, 60000);
  it("paginates on the server with stable ordering, retained filters and clamped page bounds", async () => {
    await addReviewPaginationFixtures(prefix, fixture.jobId);
    const first = await listReviewApplications(reviewFilters.parse({ job: fixture.jobId, q: prefix, page: 1 }));
    const second = await listReviewApplications(reviewFilters.parse({ job: fixture.jobId, q: prefix, page: 2 }));
    expect(first.total).toBe(28); expect(first.rows.length).toBe(25); expect(second.rows.length).toBe(3);
    expect(first.rows.some((row) => second.rows.some((other) => other.id === row.id))).toBe(false);
    expect((await listReviewApplications(reviewFilters.parse({ job: fixture.jobId, q: prefix, page: 999 }))).page).toBe(2);
  }, 60000);
  it("snapshots internal note authors and only permits the owner to delete", async () => {
    await addReviewNote(fixture.applicationId, "শ্রীময়ীর পর্যালোচনা", { userId: userId!, email });
    const note = (await loadReviewProfile(fixture.applicationId))!.notes[0];
    expect(note.adminEmailSnapshot).toBe(email);
    await expect(deleteReviewNote(fixture.applicationId, note.id, randomUUID())).rejects.toThrow("not owned");
    expect((await loadReviewProfile(fixture.applicationId))?.notes.length).toBe(1);
    await deleteReviewNote(fixture.applicationId, note.id, userId!);
    expect((await loadReviewProfile(fixture.applicationId))?.notes.length).toBe(0);
  }, 60000);
  it("creates a private short-lived signed download and retrieves the actual fixture PDF", async () => {
    const url = await authorizeReviewDownload(fixture.attachmentId);
    expect(Boolean(url && new URL(url).searchParams.has("token"))).toBe(true);
    const response = await fetch(url!, { headers: { Range: "bytes=0-8" } });
    expect(response.ok).toBe(true); expect((await response.text()).startsWith("%PDF-")).toBe(true);
  }, 60000);
  it("deletes files and all cascading rows without affecting another application", async () => {
    await deleteReviewApplication(fixture.applicationId);
    expect(await verifyReviewTestRows(prefix, fixture.applicationId)).toMatchObject({ exists: false, answers: 0, attachments: 0, notes: 0, events: 0 });
    expect(await reviewTestFilesAbsent(fixture.applicationId)).toBe(true);
    expect(Boolean(await loadReviewProfile(fixture.previousId))).toBe(true);
    await deleteReviewApplication(fixture.applicationId); // Cleanup retry is idempotent.
  }, 60000);
});
