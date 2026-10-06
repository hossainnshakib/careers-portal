import "server-only";

import { randomUUID } from "node:crypto";
import { and, count, eq, like } from "drizzle-orm";
import { getDb } from "@/db";
import { adminNotes, applications, applicationAnswers, applicationStatusEvents, attachments, jobs } from "@/db/schema";
import { requireDevTarget } from "@/db/seed/require-dev";
import { createPublicTestJob } from "./public-test-fixture";
import { createReference } from "./applications";
import { uploadReviewTestCv } from "@/lib/storage/review-test-files";

function guard(prefix: string) {
  requireDevTarget(); if (!/^e2e-[a-f0-9]{32}-$/.test(prefix)) throw new Error("Invalid review fixture prefix");
}
export async function createReviewTestApplication(prefix: string) {
  guard(prefix);
  const job = await createPublicTestJob(prefix);
  const applicationId = randomUUID(); const previousId = randomUUID(); const attachmentId = randomUUID();
  const email = `${prefix}candidate@example.com`;
  const reference = createReference();
  const values = { jobId: job.id, fullName: "শ্রী ক্ষিতিশ", email, phone: "01700000000", location: "Dhaka",
    jobTitleSnapshot: job.title, jobSlugSnapshot: job.slug, departmentNameSnapshot: "Fixture department", brandNamesSnapshot: ["Fixture brand"], primaryBrandSnapshot: "Fixture brand" };
  await getDb().insert(applications).values([
    { ...values, id: applicationId, reference },
    { ...values, id: previousId, reference: createReference(), status: "rejected", submittedAt: new Date(Date.now() - 86400000) },
  ]);
  const cv = await uploadReviewTestCv(applicationId);
  await getDb().insert(attachments).values({ id: attachmentId, applicationId, kind: "cv", storagePath: cv.path, fileName: "review-cv.pdf", mimeType: "application/pdf", sizeBytes: cv.size });
  await getDb().insert(applicationAnswers).values([
    { applicationId, questionId: job.textId, labelSnapshot: "Tell us about your work", typeSnapshot: "long_text", sectionSnapshot: "professional", sortOrder: 0, value: "আমি সৃজনশীল কাজে অভিজ্ঞ।" },
    { applicationId, labelSnapshot: "Historic unsafe URL", typeSnapshot: "url", sectionSnapshot: "portfolio", sortOrder: 1, value: "javascript:alert(1)" },
  ]);
  await getDb().insert(applicationStatusEvents).values({ applicationId, fromStatus: null, toStatus: "new" });
  return { applicationId, previousId, attachmentId, reference, jobId: job.id, title: job.title, email, brandId: job.brandId, departmentId: job.departmentId };
}
export async function reviewTestApplicationIds(prefix: string) {
  guard(prefix);
  return (await getDb().select({ id: applications.id }).from(applications).innerJoin(jobs, eq(jobs.id, applications.jobId)).where(like(jobs.slug, `${prefix}%`))).map((row) => row.id);
}
export async function addReviewPaginationFixtures(prefix: string, jobId: string) {
  guard(prefix);
  const [job] = await getDb().select().from(jobs).where(eq(jobs.id, jobId));
  if (!job?.slug.startsWith(prefix)) throw new Error("Not a review test job");
  await getDb().insert(applications).values(Array.from({ length: 26 }, (_, i) => ({
    reference: createReference(), jobId, fullName: `Pagination fixture ${i}`, email: `${prefix}${i}@example.com`, phone: "01700000000", location: "Dhaka",
    jobTitleSnapshot: job.title, jobSlugSnapshot: job.slug, departmentNameSnapshot: "Fixture department", brandNamesSnapshot: ["Fixture brand"], primaryBrandSnapshot: "Fixture brand",
  })));
}
export async function verifyReviewTestRows(prefix: string, id: string) {
  guard(prefix);
  const [app] = await getDb().select({ status: applications.status }).from(applications).innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(and(eq(applications.id, id), like(jobs.slug, `${prefix}%`)));
  const [notes, events, files, answers] = await Promise.all([
    getDb().select({ count: count() }).from(adminNotes).where(eq(adminNotes.applicationId, id)),
    getDb().select({ count: count() }).from(applicationStatusEvents).where(eq(applicationStatusEvents.applicationId, id)),
    getDb().select({ count: count() }).from(attachments).where(eq(attachments.applicationId, id)),
    getDb().select({ count: count() }).from(applicationAnswers).where(eq(applicationAnswers.applicationId, id)),
  ]);
  return { exists: !!app, status: app?.status ?? null, notes: notes[0].count, events: events[0].count, attachments: files[0].count, answers: answers[0].count };
}
