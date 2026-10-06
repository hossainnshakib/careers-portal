import { z } from "zod";
import type { QuestionDefinition } from "@/lib/questions/definition";

export const jobSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120);
export const uploadRequestSchema = z.strictObject({
  jobSlug: jobSlugSchema,
  sessionToken: z.string().min(1).max(2048).optional(),
  turnstileToken: z.string().min(1).max(2048).optional(),
  slot: z.union([z.literal("cv"), z.uuid()]),
  fileName: z.string().min(1).max(255), mime: z.string().min(1).max(150),
  size: z.number().int().positive().max(10 * 1024 * 1024),
  uploadId: z.uuid().optional(),
});
export const reservationSchema = z.strictObject({
  id: z.uuid(), sessionId: z.uuid(), jobSlug: jobSlugSchema,
  slot: z.union([z.literal("cv"), z.uuid()]),
  fileName: z.string().regex(/^[a-zA-Z0-9._-]+$/).max(120),
  mime: z.string().max(150), size: z.number().int().positive().max(10 * 1024 * 1024),
});
export type Reservation = z.infer<typeof reservationSchema>;
export const mimeByExtension: Record<string, string> = {
  pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", zip: "application/zip",
};
export function sanitizeFileName(name: string) {
  const basename = name.split(/[\\/]/).at(-1) ?? "file";
  const extension = basename.split(".").at(-1)?.toLowerCase() ?? "";
  const stem = basename.slice(0, -(extension.length + 1)).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 90) || "file";
  return `${stem}.${extension}`;
}
export function validateUploadMetadata(file: { fileName: string; mime: string; size: number }, slot: string, questions: QuestionDefinition[]) {
  const q = slot === "cv" ? undefined : questions.find((q) => q.id === slot && q.type === "file_upload");
  if (slot !== "cv" && !q) throw new Error("Invalid upload slot");
  const config = q?.config ?? {};
  const allowed = slot === "cv" ? ["pdf", "doc", "docx"] : Array.isArray(config.accept) ? config.accept : ["pdf", "png", "jpg", "webp", "zip"];
  const extension = file.fileName.split(".").at(-1)?.toLowerCase() ?? "";
  const normalized = extension === "jpeg" ? "jpg" : extension;
  const limit = slot === "cv" ? 5 * 1024 * 1024 : (typeof config.maxSizeMb === "number" ? config.maxSizeMb : 10) * 1024 * 1024;
  if (!allowed.includes(normalized) || mimeByExtension[extension] !== file.mime || file.size <= 0 || file.size > limit)
    throw new Error("Invalid upload metadata");
}
/** Content signatures supplement extension/MIME checks; attachments are download-only. */
export function hasFileSignature(mime: string, bytes: Uint8Array): boolean {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  const prefix = (values: number[]) => values.every((value, i) => bytes[i] === value);
  switch (mime) {
    case "application/pdf": return ascii(0, 5) === "%PDF-";
    case "application/msword": return prefix([208, 207, 17, 224, 161, 177, 26, 225]);
    case "application/zip":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": return prefix([80, 75, 3, 4]);
    case "image/png": return bytes.length >= 24 && prefix([137, 80, 78, 71, 13, 10, 26, 10]) && ascii(12, 16) === "IHDR";
    case "image/jpeg": return prefix([255, 216, 255]);
    case "image/webp": return bytes.length >= 16 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP" && ["VP8 ", "VP8L", "VP8X"].includes(ascii(12, 16));
    default: return false;
  }
}
