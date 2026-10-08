import "server-only";

import { randomInt, randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { applicationAnswers, applications, attachments, applicationStatusEvents } from "@/db/schema";
import type { loadApplicationJob } from "./public-jobs";
import type { Reservation } from "@/lib/validation/uploads";
import type { Answer } from "@/lib/validation/buildSchema";
import type { z } from "zod";
import type { contactSchema } from "@/lib/validation/application";
import { finalPath } from "@/lib/storage/application-files";

export type ApplicationTransaction = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
export function withUploadSession<T>(sessionId: string, work: (tx: ApplicationTransaction) => Promise<T>) {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${sessionId}, 2102))`);
    return work(tx);
  });
}
export async function existingSessionApplication(tx: ApplicationTransaction, id: string) {
  const [row] = await tx.select({ reference: applications.reference }).from(applications).where(eq(applications.id, id)).limit(1);
  return row;
}
const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export function createReference() { return `APP-${Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join("")}`; }
export async function insertApplication(tx: ApplicationTransaction, data: {
  id: string; contact: z.infer<typeof contactSchema>; definition: NonNullable<Awaited<ReturnType<typeof loadApplicationJob>>>;
  answers: Record<string, Answer>; files: Reservation[];
}) {
  const { job, department, brands, questions } = data.definition;
  const primary = brands.find((b) => b.primary);
  if (!primary || !department) throw new Error("Job definition incomplete");
  let reference: string | undefined;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = createReference();
    const [row] = await tx.insert(applications).values({
      id: data.id, reference: candidate, jobId: job.id, ...data.contact,
      jobTitleSnapshot: job.title, jobSlugSnapshot: job.slug, departmentNameSnapshot: department.name,
      brandNamesSnapshot: brands.map((b) => b.brand.name), primaryBrandSnapshot: primary.brand.name,
    }).onConflictDoNothing({ target: applications.reference }).returning({ reference: applications.reference });
    if (row) { reference = row.reference; break; }
  }
  if (!reference) throw new Error("Reference unavailable");
  const attachmentRows = data.files.map((file) => ({
    id: randomUUID(), applicationId: data.id, questionId: file.slot === "cv" ? null : file.slot,
    kind: file.slot === "cv" ? "cv" as const : questions.find((q) => q.id === file.slot)?.section === "portfolio" ? "portfolio" as const : "other" as const,
    storagePath: finalPath(file), fileName: file.fileName, mimeType: file.mime, sizeBytes: file.size,
  }));
  if (attachmentRows.length) await tx.insert(attachments).values(attachmentRows);
  const answerRows = questions.filter((q) => data.answers[q.id] !== undefined).map((q) => ({
    applicationId: data.id, questionId: q.id, labelSnapshot: q.label, typeSnapshot: q.type,
    sectionSnapshot: q.section, sortOrder: q.sortOrder,
    value: q.type === "file_upload" ? attachmentRows.filter((a) => a.questionId === q.id).map((a) => a.id) : data.answers[q.id],
  }));
  if (answerRows.length) await tx.insert(applicationAnswers).values(answerRows);
  await tx.insert(applicationStatusEvents).values({ applicationId: data.id, fromStatus: null, toStatus: "new", adminUserId: null });
  return reference;
}
