import "server-only";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { applicationAnswers, applications, attachments, brands, departments, jobs } from "@/db/schema";
import { requireDevTarget } from "@/db/seed/require-dev";
import { saveJob } from "./jobs";
import { jobInput } from "@/lib/validation/jobs";

function guard(prefix: string) { requireDevTarget(); if (!/^e2e-[a-f0-9]{32}-$/.test(prefix)) throw new Error("Invalid public test prefix"); }
export async function createPublicTestJob(prefix: string) {
  guard(prefix);
  const [brand] = await getDb().select().from(brands).where(eq(brands.status, "active")).limit(1);
  const [department] = await getDb().select().from(departments).where(eq(departments.isActive, true)).limit(1);
  if (!brand || !department) throw new Error("Base catalog required for public test");
  const questionId = randomUUID(); const textId = randomUUID();
  const saved = await saveJob(jobInput.parse({ id: null, title: `${prefix}Public Application Test`, slug: `${prefix}public`, departmentId: department.id,
    brandIds: [brand.id], primaryBrandId: brand.id, employmentType: "full_time", workMode: "remote", experienceLevel: "entry", locationText: "Dhaka",
    deadlineAt: new Date(Date.now() + 7 * 86400000).toISOString(), cvRequired: true, summary: "An ephemeral public application test role.", descriptionMd: "Work on meaningful projects.", responsibilitiesMd: "- Build carefully", requirementsMd: "- Relevant experience", intent: "publish",
    questions: [
      { id: textId, label: "Tell us about your work", type: "long_text", required: true, helpText: null, options: null, config: { maxLength: 1500 }, section: "professional", sortOrder: 0 },
      { id: questionId, label: "Work sample", type: "file_upload", required: true, helpText: "Upload a PDF sample.", options: null, config: { accept: ["pdf"], maxSizeMb: 1 }, section: "portfolio", sortOrder: 1 },
    ] }));
  return { ...saved, questionId, textId, brandSlug: brand.slug, brandId: brand.id, departmentId: department.id, departmentSlug: department.slug, title: `${prefix}Public Application Test` };
}
export async function verifyPublicTestApplication(prefix: string, reference: string) {
  guard(prefix);
  const rows = await getDb().select({ application: applications, slug: jobs.slug }).from(applications).innerJoin(jobs, eq(jobs.id, applications.jobId)).where(eq(applications.reference, reference));
  const row = rows.find((row) => row.slug.startsWith(prefix));
  if (!row) throw new Error("Test application missing");
  const answers = await getDb().select().from(applicationAnswers).where(eq(applicationAnswers.applicationId, row.application.id));
  const files = await getDb().select().from(attachments).where(eq(attachments.applicationId, row.application.id));
  return { applications: 1, answers: answers.length, attachments: files.length,
    bengaliPreserved: row.application.fullName === "শ্রী ক্ষিতিশ" && answers.some((a) => a.value === "আমি সৃজনশীল কাজে অভিজ্ঞ।"),
    snapshotsPresent: !!row.application.jobTitleSnapshot && !!row.application.primaryBrandSnapshot && answers.every((a) => !!a.labelSnapshot),
    attachmentAnswersLinked: answers.filter((a) => a.typeSnapshot === "file_upload").every((a) => Array.isArray(a.value) && a.value.every((id) => files.some((f) => f.id === id))),
    privatePaths: files.every((f) => f.storagePath.startsWith(`applications/${row.application.id}/`)) };
}
