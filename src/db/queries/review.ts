import "server-only";

import { and, asc, count, desc, eq, gte, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  adminNotes, adminUsers, applications, applicationStatusEvents, attachments,
  brands, departments, jobBrands, jobs, type Attachment,
} from "@/db/schema";
import { withUploadSession, type ApplicationTransaction } from "./applications";
import { loadDisplayAnswers } from "./application-answers";
import type { ReviewFilters } from "@/lib/validation/review";
import { quarantineReviewFiles, removeReviewQuarantine, restoreReviewFiles, signReviewAttachment } from "@/lib/storage/review-files";

export const reviewPageSize = 25;
const summary = {
  id: applications.id, reference: applications.reference, fullName: applications.fullName,
  email: applications.email, status: applications.status, submittedAt: applications.submittedAt,
  jobTitle: applications.jobTitleSnapshot, brandNames: applications.brandNamesSnapshot,
  department: applications.departmentNameSnapshot,
};
export async function loadReviewDashboard() {
  const db = getDb();
  const counts = await db.select({ status: applications.status, count: count() }).from(applications).groupBy(applications.status);
  const latest = await db.select(summary).from(applications).orderBy(desc(applications.submittedAt), desc(applications.id)).limit(10);
  const brandAccents = await db.select({ name: brands.name, accentColor: brands.accentColor }).from(brands);
  return { counts, latest, brandAccents };
}
export async function reviewFilterOptions() {
  const db = getDb();
  const brandRows = await db.select({ id: brands.id, name: brands.name, accentColor: brands.accentColor }).from(brands).orderBy(asc(brands.sortOrder));
  const departmentRows = await db.select({ id: departments.id, name: departments.name }).from(departments).orderBy(asc(departments.sortOrder));
  const jobRows = await db.select({ id: jobs.id, title: jobs.title }).from(jobs).orderBy(asc(jobs.title));
  return { brands: brandRows, departments: departmentRows, jobs: jobRows };
}
export async function listReviewApplications(filters: ReviewFilters) {
  const db = getDb();
  const query = filters.q.replace(/[\\%_]/g, "\\$&");
  const where = and(
    filters.brand ? inArray(applications.jobId, db.select({ id: jobBrands.jobId }).from(jobBrands).where(eq(jobBrands.brandId, filters.brand))) : undefined,
    filters.department ? eq(jobs.departmentId, filters.department) : undefined,
    filters.job ? eq(applications.jobId, filters.job) : undefined,
    filters.status ? eq(applications.status, filters.status) : undefined,
    query ? or(ilike(applications.fullName, `%${query}%`), ilike(applications.email, `%${query}%`)) : undefined,
    filters.from ? gte(applications.submittedAt, sql`(${filters.from}::date::timestamp at time zone ${filters.tz})`) : undefined,
    filters.to ? sql`${applications.submittedAt} < ((${filters.to}::date + 1)::timestamp at time zone ${filters.tz})` : undefined,
  );
  const [total] = await db.select({ count: count() }).from(applications).innerJoin(jobs, eq(jobs.id, applications.jobId)).where(where);
  const pages = Math.max(1, Math.ceil(total.count / reviewPageSize));
  const page = Math.min(filters.page, pages);
  const order = filters.sort === "oldest" ? asc(applications.submittedAt) :
    filters.sort === "name_asc" ? asc(applications.fullName) :
    filters.sort === "name_desc" ? desc(applications.fullName) : desc(applications.submittedAt);
  const rows = await db.select(summary).from(applications).innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(where).orderBy(order, desc(applications.id)).limit(reviewPageSize).offset((page - 1) * reviewPageSize);
  return { rows, total: total.count, page, pages };
}
export async function loadReviewProfile(id: string) {
  const db = getDb();
  const [application] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  if (!application) return null;
  // Keep this bounded read set sequential for the shared transaction pooler.
  const answers = await loadDisplayAnswers(id);
  const files = await db.select().from(attachments).where(eq(attachments.applicationId, id)).orderBy(asc(attachments.createdAt));
  const notes = await db.select().from(adminNotes).where(eq(adminNotes.applicationId, id)).orderBy(desc(adminNotes.createdAt), desc(adminNotes.id));
  const events = await db.select({ event: applicationStatusEvents, adminEmail: adminUsers.email }).from(applicationStatusEvents)
      .leftJoin(adminUsers, eq(adminUsers.userId, applicationStatusEvents.adminUserId))
      .where(eq(applicationStatusEvents.applicationId, id)).orderBy(desc(applicationStatusEvents.createdAt), desc(applicationStatusEvents.id));
  const previous = await db.select(summary).from(applications).where(and(ne(applications.id, id), sql`lower(${applications.email}) = lower(${application.email})`))
      .orderBy(desc(applications.submittedAt)).limit(50);
  return { application, answers, files, notes, events: events.map(({ event, adminEmail }) => ({ ...event, adminEmail })), previous };
}
async function lockedApplication(tx: ApplicationTransaction, id: string) {
  const [row] = await tx.select().from(applications).where(eq(applications.id, id)).for("update");
  return row;
}
export async function changeReviewStatus(id: string, status: typeof applications.$inferSelect.status, adminId: string) {
  return withUploadSession(id, async (tx) => {
    const row = await lockedApplication(tx, id);
    if (!row) throw new Error("Application not found");
    if (row.status === status) return;
    const now = new Date();
    await tx.update(applications).set({ status, statusChangedAt: now }).where(eq(applications.id, id));
    await tx.insert(applicationStatusEvents).values({ applicationId: id, fromStatus: row.status, toStatus: status, adminUserId: adminId, createdAt: now });
  });
}
export async function addReviewNote(id: string, note: string, admin: { userId: string; email: string }) {
  return withUploadSession(id, async (tx) => {
    if (!(await lockedApplication(tx, id))) throw new Error("Application not found");
    await tx.insert(adminNotes).values({ applicationId: id, note, adminUserId: admin.userId, adminEmailSnapshot: admin.email });
  });
}
export async function deleteReviewNote(id: string, noteId: string, adminId: string) {
  return withUploadSession(id, async (tx) => {
    if (!(await lockedApplication(tx, id))) throw new Error("Application not found");
    const deleted = await tx.delete(adminNotes).where(and(eq(adminNotes.id, noteId), eq(adminNotes.applicationId, id), eq(adminNotes.adminUserId, adminId))).returning({ id: adminNotes.id });
    if (!deleted.length) throw new Error("Note not found or not owned");
  });
}
export async function authorizeReviewDownload(id: string) {
  const [file] = await getDb().select().from(attachments).where(eq(attachments.id, id)).limit(1);
  if (!file) return null;
  return withUploadSession(file.applicationId, async (tx) => {
    if (!(await lockedApplication(tx, file.applicationId))) return null;
    const [current] = await tx.select().from(attachments).where(eq(attachments.id, id)).limit(1);
    if (!current) return null;
    await restoreReviewFiles(await tx.select().from(attachments).where(eq(attachments.applicationId, file.applicationId)));
    return signReviewAttachment(current);
  });
}
export async function deleteReviewApplication(id: string) {
  let files: Attachment[] = [];
  try {
    await withUploadSession(id, async (tx) => {
      const row = await lockedApplication(tx, id);
      if (!row) return; // Retry cleanup after a committed deletion.
      files = await tx.select().from(attachments).where(eq(attachments.applicationId, id));
      await quarantineReviewFiles(files);
      await tx.delete(applications).where(eq(applications.id, id));
    });
  } catch {
    // A commit acknowledgement can be lost. Only restore when the DB row remains.
    await withUploadSession(id, async (tx) => {
      if (await lockedApplication(tx, id)) await restoreReviewFiles(files);
    });
    throw new Error("Application deletion failed");
  }
  await withUploadSession(id, async () => { await removeReviewQuarantine(id); });
}
