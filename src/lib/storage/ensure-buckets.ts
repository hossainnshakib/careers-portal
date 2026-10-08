import "server-only";

import { fileURLToPath } from "node:url";
import { requireDevTarget } from "@/db/seed/require-dev";
import { mimeByExtension } from "@/lib/validation/uploads";
import { getStorageClient } from "./client";

export const bucketDefinitions = [
  {
    id: "applications", public: false, fileSizeLimit: 10 * 1024 * 1024,
    // JSON is server-written reservation metadata, not a permitted candidate upload.
    allowedMimeTypes: [...new Set(Object.values(mimeByExtension)), "application/json"],
  },
  {
    id: "brand-assets", public: true, fileSizeLimit: 1024 * 1024,
    allowedMimeTypes: ["image/svg+xml", "image/png", "image/webp"],
  },
];

export async function ensureBuckets() {
  const storage = getStorageClient();
  const { data, error } = await storage.listBuckets();
  if (error) throw new Error("Cannot inspect Storage buckets.");
  for (const bucket of bucketDefinitions) {
    const existing = data.find((item) => item.id === bucket.id);
    if (existing && existing.public !== bucket.public)
      throw new Error("Bucket visibility differs from the documented configuration.");
    const result = existing
      ? await storage.updateBucket(bucket.id, bucket)
      : await storage.createBucket(bucket.id, bucket);
    if (result.error) throw new Error("Could not configure Storage bucket.");
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  Promise.resolve().then(() => { requireDevTarget(); return ensureBuckets(); }).then(
    () => console.info("Storage buckets configured."),
    () => {
      console.error("Storage setup failed. Check dev project configuration.");
      process.exitCode = 1;
    },
  );
}
