import { expect, it } from "vitest";
import { checkApprovedInventory, checkRemainingInventory, checkUploadAuthorizationExpiry, parseArtifactCleanupCommand } from "./artifact-cleanup-policy";
import { demoSlugs, demoDisclaimer, demoMarker } from "@/lib/demo";
import type { CleanupInventory } from "@/db/queries/demo-cleanup-inventory";

function inventory(): CleanupInventory {
  const jobs = demoSlugs.map((slug, index) => ({ id: `job-${index}`, slug, title: `DEMO — ${demoDisclaimer}`, description_md: `${demoDisclaimer}\n${demoMarker}` }));
  return {
    tables: { jobs, job_questions: Array.from({ length: 52 }, () => ({ job_id: jobs[0].id })), job_brands: Array.from({ length: 9 }, () => ({ job_id: jobs[0].id })), job_option_links: Array.from({ length: 16 }, () => ({ job_id: jobs[0].id })) },
    applicationCounts: { applications: 0, application_answers: 0, attachments: 0, admin_notes: 0, application_status_events: 0 },
    structure: Object.fromEntries(Object.entries({ departments: 6, brands: 8, job_options: 13, admin_users: 1 }).map(([table, count]) => [table, { count, hash: "unchanged" }])),
    objects: Array.from({ length: 20 }, (_, index) => ({ id: `object-${index}`, bucket_id: "applications", name: `pending/session/${index}`, updated_at: "2026-01-01T00:00:00Z" })),
  };
}
it("requires a pinned external manifest and explicit apply confirmation; defaults to dry-run", () => {
  const flags = ["--backup=C:/external/backup", `--sha256=${"a".repeat(64)}`];
  expect(parseArtifactCleanupCommand(flags).write).toBe(false);
  expect(parseArtifactCleanupCommand([...flags, "--apply", "--confirm=xmtoccukridshadnxrlc"]).write).toBe(true);
  for (const extra of [["--apply"], ["--confirm=xmtoccukridshadnxrlc"], ["--apply", "--confirm=wrong"], ["--unknown"], [flags[0]]]) expect(() => parseArtifactCleanupCommand([...flags, ...extra])).toThrow();
});
it("accepts only the approved complete graph with zero application-related data", () => {
  expect(() => checkApprovedInventory(inventory())).not.toThrow();
  for (const change of [
    (i: CleanupInventory) => { i.tables.jobs[0].description_md = "not owned"; },
    (i: CleanupInventory) => { i.tables.job_questions.pop(); },
    (i: CleanupInventory) => { i.tables.job_brands[0].job_id = "unrelated"; },
    (i: CleanupInventory) => { i.applicationCounts.applications = 1; },
    (i: CleanupInventory) => { i.applicationCounts.attachments = 1; },
    (i: CleanupInventory) => { i.structure.brands.count = 9; },
    (i: CleanupInventory) => { i.objects.push({}); },
    (i: CleanupInventory) => { i.objects[0].bucket_id = "brand-assets"; },
  ]) { const i = inventory(); change(i); expect(() => checkApprovedInventory(i)).toThrow(); }
});
it("blocks active or invalid upload timestamps while allowing read-only backup", () => {
  const i = inventory(); i.objects[0].updated_at = new Date().toISOString();
  expect(() => checkApprovedInventory(i)).toThrow("active");
  expect(() => checkApprovedInventory(i, Date.now(), false)).not.toThrow();
  i.objects[0].updated_at = "invalid";
  expect(() => checkApprovedInventory(i)).toThrow("active");
});
it("waits a full URL lifetime after locked job removal even if reservations are older", () => {
  const deleted = "2026-10-17T15:56:12.792Z";
  expect(() => checkUploadAuthorizationExpiry(deleted, Date.parse("2026-10-17T17:07:00Z"))).toThrow();
  expect(() => checkUploadAuthorizationExpiry(deleted, Date.parse("2026-10-17T17:58:00Z"))).not.toThrow();
  expect(() => checkUploadAuthorizationExpiry("invalid")).toThrow();
});
it("allows idempotent partial progress only with unchanged structural data and exact original objects", () => {
  const original = inventory(); const current = structuredClone(original);
  current.tables = Object.fromEntries(Object.keys(current.tables).map(table => [table, []]));
  current.objects.splice(0, 10);
  expect(() => checkRemainingInventory(current, original)).not.toThrow();
  current.objects[0].updated_at = "changed";
  expect(() => checkRemainingInventory(current, original)).toThrow();
  current.objects = []; current.structure.admin_users.hash = "changed";
  expect(() => checkRemainingInventory(current, original)).toThrow();
});
