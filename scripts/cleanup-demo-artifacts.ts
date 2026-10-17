import "server-only";

import { readFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { closeDb } from "@/db";
import { requireDevTarget } from "@/db/seed/require-dev";
import { loadDemoCleanupInventory } from "@/db/queries/demo-cleanup-inventory";
import { checkApprovedInventory, checkRemainingInventory, checkUploadAuthorizationExpiry, cleanupManifestSchema, expectedDemoJobSlug, issuerRetirementReceiptSchema, jobRemovalReceiptSchema, parseArtifactCleanupCommand } from "@/db/seed/artifact-cleanup-policy";
import { artifactHash, removeCleanupArtifacts } from "@/lib/storage/demo-cleanup";
import { reservationSchema } from "@/lib/validation/uploads";
import { requireConversionCleanupTarget } from "@/lib/maintenance/require-target";

try {
  const options = parseArtifactCleanupCommand(process.argv.slice(2));
  if (options.ownerConversion) requireConversionCleanupTarget(options.write);
  else requireDevTarget();
  if (!isAbsolute(options.backup)) throw new Error("Use an external absolute backup directory.");
  const bytes = await readFile(join(options.backup, "manifest.json"));
  if (artifactHash(bytes) !== options.sha256) throw new Error("Unapproved manifest.");
  const manifest = cleanupManifestSchema.parse(JSON.parse(bytes.toString("utf8")));
  const receipt = jobRemovalReceiptSchema.parse(JSON.parse(await readFile(join(options.backup, "job-removal-receipt.json"), "utf8")));
  if (receipt.manifestSha256 !== options.sha256) throw new Error("Unrelated job removal receipt.");
  // A retry can issue another signed URL without updating a reservation. The
  // locked job-removal time, not object age alone, bounds the last authorization.
  checkUploadAuthorizationExpiry(receipt.deletedAt);
  if (options.ownerConversion) {
    // Owner records verified retirement of ALL privileged issuers, not object age.
    // Historical app job removal alone cannot bound URLs minted directly by old keys.
    const retirement = issuerRetirementReceiptSchema.parse(JSON.parse(await readFile(join(options.backup, "issuer-retirement-receipt.json"), "utf8")));
    checkUploadAuthorizationExpiry(retirement.lastIssuerStoppedAt);
  }
  checkApprovedInventory(manifest.inventory);
  const reservations = [];
  for (const artifact of manifest.artifacts) {
    const original = manifest.inventory.objects.find(object => object.id === artifact.id && object.name === artifact.name);
    if (!original || original.bucket_id !== "applications") throw new Error("Uninventoried artifact.");
    const local = await readFile(join(options.backup, "objects", `${artifact.id}.bin`));
    if (artifactHash(local) !== artifact.sha256 || local.length !== artifact.size) throw new Error("Invalid backup bytes.");
    if (artifact.name.includes("/reservations/")) {
      const reservation = reservationSchema.parse(JSON.parse(local.toString("utf8")));
      if (!expectedDemoJobSlug(reservation.jobSlug) || artifact.name !== `pending/${reservation.sessionId}/reservations/${reservation.id}.json`) throw new Error("Unknown reservation ownership.");
      reservations.push(reservation);
    }
  }
  if (new Set(manifest.artifacts.map(a => a.id)).size !== 20 || reservations.length !== 16) throw new Error("Unexpected approved manifest.");
  for (const artifact of manifest.artifacts.filter(a => !a.name.includes("/reservations/"))) {
    if (!reservations.some(r => artifact.name === `pending/${r.sessionId}/${r.id}-${r.fileName}` && artifact.size === r.size)) throw new Error("Unowned file.");
  }
  const current = await loadDemoCleanupInventory(undefined, options.ownerConversion);
  checkRemainingInventory(current, manifest.inventory);
  const remaining = manifest.artifacts.filter(a => current.objects.some(object => object.id === a.id));
  const verified = await removeCleanupArtifacts(remaining, false, options.ownerConversion);
  if (options.write) {
    checkRemainingInventory(await loadDemoCleanupInventory(undefined, options.ownerConversion), manifest.inventory);
    const removal = await removeCleanupArtifacts(remaining, true, options.ownerConversion);
    const final = await loadDemoCleanupInventory(undefined, options.ownerConversion);
    checkRemainingInventory(final, manifest.inventory);
    if (final.objects.length) throw new Error("Objects remain; inspect retained backup.");
    console.info(JSON.stringify({ dryRun: false, jobsRemoved: 0, objectsRemoved: removal.removed, remainingJobs: 0, remainingApplications: 0, remainingObjects: 0, structurePreserved: true }));
  } else console.info(JSON.stringify({ dryRun: true, jobs: 0, applications: 0, verifiedObjects: verified.verified, backupVerified: true, changed: 0 }));
} catch {
  console.error("Scoped DEMO cleanup refused or failed. No broad cleanup is permitted. Verify target, approved manifest/backup, expired uploads and unchanged records; preserve the backup and inspect partial progress before retrying.");
  process.exitCode = 1;
} finally { await closeDb(); }
