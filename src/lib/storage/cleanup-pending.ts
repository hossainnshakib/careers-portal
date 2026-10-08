import "server-only";

import { getStorageClient } from "./client";

const pageSize = 1000;
const staleAfterMs = 24 * 60 * 60 * 1000;

/** Never reads object bodies, filenames from applicant rows, or committed paths. */
export async function cleanupPendingUploads(now = new Date()) {
  const bucket = getStorageClient().from("applications");
  const stale: string[] = [];
  let scannedObjects = 0;
  const cutoff = now.getTime() - staleAfterMs;

  async function collect(prefix: string): Promise<void> {
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await bucket.list(prefix, { limit: pageSize, offset, sortBy: { column: "name", order: "asc" } });
      if (error || !data) throw new Error("Unable to inspect pending uploads.");
      for (const object of data) {
        if (!object.name || /[\\/]/.test(object.name) || object.name === "." || object.name === "..")
          throw new Error("Invalid pending object entry.");
        const path = `${prefix}/${object.name}`;
        if (object.id === null) {
          await collect(path);
          continue;
        }
        scannedObjects++;
        // Retain malformed timestamps and recently touched objects conservatively.
        const created = Date.parse(object.created_at ?? "");
        const updated = Date.parse(object.updated_at || object.created_at || "");
        if (Number.isFinite(created) && Number.isFinite(updated) && Math.max(created, updated) < cutoff)
          stale.push(path);
      }
      if (data.length < pageSize) return;
    }
  }

  // Finish pagination before deleting: offset pages must not shift under removal.
  await collect("pending");
  let removedObjects = 0;
  for (let start = 0; start < stale.length; start += 100) {
    const { data, error } = await bucket.remove(stale.slice(start, start + 100));
    if (error || !data) throw new Error("Unable to remove stale pending uploads.");
    removedObjects += data.length;
  }
  return { scannedObjects, removedObjects };
}
