import "server-only";

import { createHash } from "node:crypto";
import { getStorageClient } from "./client";
import { requireDevTarget } from "@/db/seed/require-dev";
import { approvedDemoProject } from "@/db/seed/validation-policy";
import { requireConversionCleanupTarget } from "@/lib/maintenance/require-target";
import { artifactSchema } from "@/db/seed/artifact-cleanup-policy";
import type { z } from "zod";

export const artifactHash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
function guard(ownerConversion = false, write = false) {
  if (ownerConversion) { requireConversionCleanupTarget(write); return; }
  requireDevTarget();
  if (process.env.DEV_SUPABASE_PROJECT_REF !== approvedDemoProject) throw new Error("Unauthorized artifact target.");
}
export async function downloadCleanupArtifact(path: string, ownerConversion = false) {
  guard(ownerConversion);
  if (!path.startsWith("pending/") || path.includes("..")) throw new Error("Invalid pending path.");
  const result = await getStorageClient().from("applications").download(path);
  if (result.error || !result.data) throw new Error("Cannot back up approved artifact.");
  return new Uint8Array(await result.data.arrayBuffer());
}
export async function removeCleanupArtifacts(artifacts: z.infer<typeof artifactSchema>[], write: boolean, ownerConversion = false) {
  guard(ownerConversion, write);
  const checked = artifacts.map(artifact => artifactSchema.parse(artifact));
  if (new Set(checked.map(a => a.id)).size !== checked.length || new Set(checked.map(a => a.name)).size !== checked.length) throw new Error("Duplicate artifact.");
  // Validate every current byte before removing any object. Missing entries are
  // filtered by the caller's authoritative read-only inventory, not ignored here.
  for (const artifact of checked) {
    const bytes = await downloadCleanupArtifact(artifact.name, ownerConversion);
    if (bytes.length !== artifact.size || artifactHash(bytes) !== artifact.sha256) throw new Error("Artifact changed; cleanup refused.");
  }
  if (!write || !checked.length) return { removed: 0, verified: checked.length };
  const result = await getStorageClient().from("applications").remove(checked.map(artifact => artifact.name));
  if (result.error) throw new Error("Scoped artifact removal failed; backup retained.");
  return { removed: result.data.length, verified: checked.length };
}
