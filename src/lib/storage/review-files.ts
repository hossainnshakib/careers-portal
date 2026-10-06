import "server-only";

import { z } from "zod";
import type { Attachment } from "@/db/schema";
import { getStorageClient } from "./client";

const bucket = () => getStorageClient().from("applications");
type ReviewFile = Pick<Attachment, "id" | "applicationId" | "storagePath" | "fileName">;
function checkedPath(file: ReviewFile) {
  z.uuid().parse(file.id);
  z.uuid().parse(file.applicationId);
  if ([".", ".."].includes(file.storagePath.split("/").at(-1) ?? "") ||
      !file.storagePath.startsWith(`applications/${file.applicationId}/`) ||
      !/^applications\/[0-9a-f-]{36}\/[a-zA-Z0-9._-]+$/.test(file.storagePath)) {
    throw new Error("Invalid attachment path");
  }
  return file.storagePath;
}
function quarantinePath(file: ReviewFile) {
  checkedPath(file);
  return `deleting/${file.applicationId}/${file.id}`;
}
async function exists(path: string) {
  // Storage's HEAD-based exists() returns an error even for a missing object.
  // JSON metadata preserves NoSuchKey, distinguishing absence from auth/outages.
  const result = await bucket().info(path);
  if (!result.error) return true;
  const error = result.error;
  if (error.status === 404 || error.statusCode === "404" || ("code" in error && error.code === "NoSuchKey")) return false;
  throw new Error("Cannot inspect attachment");
}

/** Caller holds the application's session/advisory and row locks. */
export async function restoreReviewFiles(files: ReviewFile[]) {
  for (const file of files) {
    const pending = quarantinePath(file);
    if (!(await exists(pending))) continue;
    if (await exists(checkedPath(file))) throw new Error("Attachment recovery conflict");
    const result = await bucket().move(pending, checkedPath(file));
    if (result.error) throw new Error("Cannot restore attachment");
  }
}
export async function quarantineReviewFiles(files: ReviewFile[]) {
  // Resume a prior interrupted deletion before starting another attempt.
  await restoreReviewFiles(files);
  for (const file of files) {
    if (!(await exists(checkedPath(file)))) continue; // An already absent object needs no deletion.
    const result = await bucket().move(checkedPath(file), quarantinePath(file));
    if (result.error) throw new Error("Cannot prepare attachment deletion");
  }
}
export async function removeReviewQuarantine(applicationId: string) {
  z.uuid().parse(applicationId);
  const folder = `deleting/${applicationId}`;
  const listed = await bucket().list(folder, { limit: 1000 });
  if (listed.error || listed.data.length >= 1000) throw new Error("Cannot inspect deletion files");
  const paths = listed.data.map((item) => {
    z.uuid().parse(item.name);
    if (!item.id) throw new Error("Invalid deletion object");
    return `${folder}/${item.name}`;
  });
  if (paths.length && (await bucket().remove(paths)).error) throw new Error("Attachment deletion cleanup failed");
}
export async function signReviewAttachment(file: ReviewFile) {
  const filename = file.fileName.replace(/[\r\n\u0000-\u001F/\\]/g, "_").slice(0, 255) || "attachment";
  const signed = await bucket().createSignedUrl(checkedPath(file), 60, { download: filename });
  if (signed.error) throw new Error("Cannot authorize attachment download");
  return signed.data.signedUrl;
}
