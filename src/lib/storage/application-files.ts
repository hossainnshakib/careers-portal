import "server-only";

import { randomUUID } from "node:crypto";
import { getStorageClient } from "./client";
import { hasFileSignature, reservationSchema, sanitizeFileName, validateUploadMetadata, type Reservation } from "@/lib/validation/uploads";
import type { QuestionDefinition } from "@/lib/questions/definition";
import type { UploadSession } from "@/lib/upload-session";

function bucket() { return getStorageClient().from("applications"); }
function reservationPath(sessionId: string, id: string) { return `pending/${sessionId}/reservations/${id}.json`; }
export function pendingPath(file: Reservation) { return `pending/${file.sessionId}/${file.id}-${file.fileName}`; }
export function finalPath(file: Reservation) { return `applications/${file.sessionId}/${file.id}-${file.fileName}`; }

/** Caller holds the transaction-scoped session lock; reservations also count unfinished uploads. */
export async function reserveUpload(session: UploadSession, file: {
  slot: string; fileName: string; mime: string; size: number; uploadId?: string;
}, questions: QuestionDefinition[]) {
  validateUploadMetadata(file, file.slot, questions);
  let reservation: Reservation;
  if (file.uploadId) {
    reservation = await loadReservation(session, file.uploadId);
    if (reservation.slot !== file.slot || reservation.fileName !== sanitizeFileName(file.fileName) || reservation.mime !== file.mime || reservation.size !== file.size)
      throw new Error("Upload retry differs from reservation");
    const existing = await bucket().info(pendingPath(reservation));
    if (!existing.error) {
      if (existing.data.size !== reservation.size || existing.data.contentType !== reservation.mime) throw new Error("Existing upload differs from reservation");
      return { uploadId: reservation.id, signedUrl: "", uploaded: true };
    }
  } else {
    const listed = await bucket().list(`pending/${session.id}/reservations`, { limit: 9 });
    if (listed.error || listed.data.length >= 8) throw new Error("Upload limit reached");
    reservation = reservationSchema.parse({ id: randomUUID(), sessionId: session.id, jobSlug: session.jobSlug,
      slot: file.slot, fileName: sanitizeFileName(file.fileName), mime: file.mime, size: file.size });
    const stored = await bucket().upload(reservationPath(session.id, reservation.id), JSON.stringify(reservation), { contentType: "application/json", upsert: false });
    if (stored.error) throw new Error("Upload reservation failed");
  }
  const signed = await bucket().createSignedUploadUrl(pendingPath(reservation), { upsert: false });
  if (signed.error) throw new Error("Upload authorization failed");
  return { uploadId: reservation.id, signedUrl: signed.data.signedUrl };
}
export async function loadReservation(session: UploadSession, id: string): Promise<Reservation> {
  const response = await bucket().download(reservationPath(session.id, id));
  if (response.error || response.data.size > 4096) throw new Error("Upload reservation missing");
  const file = reservationSchema.parse(JSON.parse(await response.data.text()));
  if (file.id !== id || file.sessionId !== session.id || file.jobSlug !== session.jobSlug) throw new Error("Upload ownership mismatch");
  return file;
}
async function readSignature(path: string) {
  const signed = await bucket().createSignedUrl(path, 60);
  if (signed.error) throw new Error("Cannot verify upload");
  const response = await fetch(signed.data.signedUrl, { headers: { Range: "bytes=0-511" }, cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (!response.ok || !response.body) throw new Error("Cannot verify upload");
  const reader = response.body.getReader();
  const bytes = new Uint8Array(512);
  let length = 0;
  try {
    while (length < bytes.length) {
      const chunk = await reader.read();
      if (chunk.done) break;
      const take = Math.min(chunk.value.length, bytes.length - length);
      bytes.set(chunk.value.subarray(0, take), length); length += take;
    }
  } finally { await reader.cancel(); }
  return bytes.subarray(0, length);
}
export async function verifyUploadedFile(session: UploadSession, id: string, slot: string, questions: QuestionDefinition[]) {
  const file = await loadReservation(session, id);
  if (file.slot !== slot) throw new Error("Upload slot mismatch");
  validateUploadMetadata(file, slot, questions);
  const info = await bucket().info(pendingPath(file));
  if (info.error || info.data.size !== file.size || info.data.contentType !== file.mime) throw new Error("Upload MIME or size mismatch");
  if (!hasFileSignature(file.mime, await readSignature(pendingPath(file)))) throw new Error("Upload content mismatch");
  return file;
}
export async function moveApplicationFile(file: Reservation) {
  const moved = await bucket().move(pendingPath(file), finalPath(file));
  if (moved.error) throw new Error("Upload finalization failed");
}
export async function restoreApplicationFiles(files: Reservation[]) {
  // A signed URL cannot overwrite an existing object. Remove a replayed pending
  // object before restoring the original verified bytes after a failed DB write.
  for (const file of files) {
    const removed = await bucket().remove([pendingPath(file)]);
    if (removed.error) throw new Error("Upload rollback failed");
    const moved = await bucket().move(finalPath(file), pendingPath(file));
    if (moved.error) throw new Error("Upload rollback failed");
  }
}
