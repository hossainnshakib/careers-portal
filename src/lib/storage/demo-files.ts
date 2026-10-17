import "server-only";

import { getStorageClient } from "./client";
import { requireDevTarget } from "@/db/seed/require-dev";

export async function uploadDemoFile(path: string, bytes: Uint8Array, contentType: string) {
  requireDevTarget();
  const { error } = await getStorageClient()
    .from("applications")
    .upload(path, bytes, { contentType, upsert: true });
  if (error) throw new Error("Demo file upload failed.");
}
