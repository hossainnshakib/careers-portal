import "server-only";

import type { loadPdfProfile } from "@/db/queries/pdf";
import { pdfLogo } from "./logo";
import type { PdfModel } from "./model";

export async function buildPdfModel(profile: NonNullable<Awaited<ReturnType<typeof loadPdfProfile>>>, timezone: string, locale: string): Promise<PdfModel> {
  const app = profile.application;
  return {
    reference: app.reference, fullName: app.fullName, email: app.email, phone: app.phone, location: app.location,
    title: app.jobTitleSnapshot, brands: app.brandNamesSnapshot ?? [], department: app.departmentNameSnapshot, primaryBrand: app.primaryBrandSnapshot,
    status: app.status, appliedAt: app.submittedAt.toISOString(),
    consentAt: app.consentAt?.toISOString(), generatedAt: new Date().toISOString(), timezone, locale,
    accent: /^#[0-9a-f]{6}$/i.test(profile.brand?.accent ?? "") ? profile.brand!.accent! : "#30303B",
    logo: await pdfLogo(profile.brand?.logo ?? null),
    answers: profile.answers.map((answer) => ({ label: answer.labelSnapshot, type: answer.typeSnapshot, section: answer.sectionSnapshot, value: answer.value,
      questionOptions: answer.questionOptions, optionsSnapshot: "optionsSnapshot" in answer ? answer.optionsSnapshot : undefined })),
    attachments: profile.files.map((file) => ({ id: file.id, name: file.fileName, size: file.sizeBytes, kind: file.kind })),
    notes: profile.notes.map((note) => ({ note: note.note, author: note.adminEmailSnapshot, createdAt: note.createdAt.toISOString() })),
  };
}
