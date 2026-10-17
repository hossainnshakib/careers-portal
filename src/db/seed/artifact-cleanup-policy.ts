import { z } from "zod";
import { ownsValidationJob, demoSlugs } from "@/lib/demo";
import type { CleanupInventory } from "@/db/queries/demo-cleanup-inventory";
import { approvedDemoProject } from "./validation-policy";

// Independent source pin for the one previously approved external backup (not a secret).
export const approvedCleanupManifestSha256 = "be450f62a44746f6577161fde41fb1972eb1e164bf723f487e9cd65bb17e2562";

export const artifactSchema = z.strictObject({
  id: z.uuid(), name: z.string().regex(/^pending\/[a-f0-9-]{36}\/(?:reservations\/[a-f0-9-]{36}\.json|[a-f0-9-]{36}-[^/]+)$/),
  size: z.number().int().positive(), sha256: z.string().regex(/^[a-f0-9]{64}$/), mime: z.string().min(1),
});
export const cleanupManifestSchema = z.strictObject({
  version: z.literal(1), project: z.literal(approvedDemoProject),
  inventory: z.custom<CleanupInventory>(), artifacts: z.array(artifactSchema).length(20),
});
export type CleanupManifest = z.infer<typeof cleanupManifestSchema>;
export const jobRemovalReceiptSchema = z.strictObject({ deletedAt: z.string().datetime(), manifestSha256: z.string().regex(/^[a-f0-9]{64}$/) });
export const issuerRetirementReceiptSchema = z.strictObject({ lastIssuerStoppedAt: z.string().datetime(), manifestSha256: z.literal(approvedCleanupManifestSha256) });
export function checkUploadAuthorizationExpiry(deletedAt: string, now = Date.now()) {
  const cutoff = Date.parse(deletedAt) + 2 * 60 * 60 * 1000 + 60000;
  if (!Number.isFinite(cutoff) || now <= cutoff) throw new Error("Previously issued upload URLs may remain active.");
  return cutoff;
}

/** This one-off approval covers the inventoried five-job/20-object dataset, not a prefix wipe. */
export function checkApprovedInventory(inventory: CleanupInventory, now = Date.now(), requireExpired = true) {
  const jobs = inventory.tables.jobs;
  if (jobs.length !== 5 || new Set(jobs.map(j => j.slug)).size !== 5 || jobs.some(j => !ownsValidationJob({ slug: String(j.slug), title: String(j.title), descriptionMd: String(j.description_md) }))) throw new Error("Unexpected jobs.");
  if (Object.values(inventory.applicationCounts).some(count => count !== 0)) throw new Error("Application data exists.");
  for (const [table, count] of Object.entries({ job_questions: 52, job_brands: 9, job_option_links: 16 })) {
    if (inventory.tables[table].length !== count || inventory.tables[table].some(row => !jobs.some(job => job.id === row.job_id))) throw new Error("Unexpected dependencies.");
  }
  for (const [table, count] of Object.entries({ departments: 6, brands: 8, job_options: 13, admin_users: 1 })) {
    if (inventory.structure[table]?.count !== count) throw new Error("Unexpected structural data.");
  }
  if (inventory.objects.length !== 20 || inventory.objects.some(object => object.bucket_id !== "applications" || !String(object.name).startsWith("pending/"))) throw new Error("Unexpected Storage objects.");
  // Both session credentials and signed upload URLs must be expired before removing their reservations.
  if (requireExpired && inventory.objects.some(object => !Number.isFinite(Date.parse(String(object.updated_at))) || now - Date.parse(String(object.updated_at)) <= 2 * 60 * 60 * 1000 + 60000)) throw new Error("Uploads may still be active.");
}

export function checkRemainingInventory(current: CleanupInventory, original: CleanupInventory) {
  if (JSON.stringify(current.structure) !== JSON.stringify(original.structure) || Object.values(current.applicationCounts).some(count => count !== 0)) throw new Error("Preserved data changed.");
  if (Object.values(current.tables).some(rows => rows.length)) throw new Error("Jobs/dependencies still exist.");
  if (current.objects.some(object => !original.objects.some(prior => JSON.stringify(prior) === JSON.stringify(object)))) throw new Error("Unexpected or changed object.");
}

export function parseArtifactCleanupCommand(args: string[]) {
  if (new Set(args.map(arg => arg.split("=")[0])).size !== args.length || args.some(arg => !/^--(?:backup=.+|sha256=[a-f0-9]{64}|apply|confirm=.+|owner-conversion)$/.test(arg))) throw new Error("Invalid cleanup flags.");
  const backup = args.find(arg => arg.startsWith("--backup="))?.slice(9);
  const sha256 = args.find(arg => arg.startsWith("--sha256="))?.slice(9);
  const write = args.includes("--apply");
  const ownerConversion = args.includes("--owner-conversion");
  const confirmation = args.find(arg => arg.startsWith("--confirm="));
  if (!backup || !sha256 || (write ? confirmation !== `--confirm=${approvedDemoProject}` : confirmation !== undefined)) throw new Error("Explicit manifest and apply confirmation required.");
  if (ownerConversion && sha256 !== approvedCleanupManifestSha256) throw new Error("Only the originally approved manifest is eligible for conversion cleanup.");
  return { backup, sha256, write, ownerConversion };
}

export function expectedDemoJobSlug(value: string) { return (demoSlugs as readonly string[]).includes(value); }
