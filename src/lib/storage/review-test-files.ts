import "server-only";

import { z } from "zod";
import { requireDevTarget } from "@/db/seed/require-dev";
import { getStorageClient } from "./client";

export async function uploadReviewTestCv(applicationId: string) {
  requireDevTarget(); z.uuid().parse(applicationId);
  let document = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const [i, body] of ["<</Type /Catalog /Pages 2 0 R>>", "<</Type /Pages /Kids [3 0 R] /Count 1>>", "<</Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources <<>>>>", "<</Length 0>>\nstream\n\nendstream"].entries()) {
    offsets.push(Buffer.byteLength(document)); document += `${i + 1} 0 obj\n${body}\nendobj\n`;
  }
  const xref = Buffer.byteLength(document);
  document += `xref\n0 5\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<</Size 5 /Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`;
  const bytes = Buffer.from(document);
  const path = `applications/${applicationId}/review-cv.pdf`;
  const result = await getStorageClient().from("applications").upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (result.error) throw new Error("Review fixture CV setup failed");
  return { path, size: bytes.length };
}
export async function removeReviewTestFiles(applicationIds: string[]) {
  requireDevTarget();
  const bucket = getStorageClient().from("applications");
  for (const id of z.array(z.uuid()).max(100).parse(applicationIds)) {
    for (const folder of [`applications/${id}`, `deleting/${id}`]) {
      const listed = await bucket.list(folder, { limit: 100 });
      if (listed.error) throw new Error("Review fixture file listing failed");
      const paths = listed.data.filter((file) => file.id).map((file) => `${folder}/${file.name}`);
      if (paths.length && (await bucket.remove(paths)).error) throw new Error("Review fixture file cleanup failed");
    }
  }
}
export async function reviewTestFilesAbsent(id: string) {
  requireDevTarget(); z.uuid().parse(id);
  const bucket = getStorageClient().from("applications");
  const [original, deleted] = await Promise.all([bucket.list(`applications/${id}`), bucket.list(`deleting/${id}`)]);
  if (original.error || deleted.error) throw new Error("Review file verification failed");
  return original.data.length === 0 && deleted.data.length === 0;
}
