import type { Job, JobQuestion } from "@/db/schema";
import type { JobInput } from "@/lib/validation/jobs";

export function checkJobEdit(existing: Pick<Job, "slug" | "publishedAt"> | null, input: JobInput) {
  if (existing?.publishedAt && existing.slug !== input.slug)
    throw new Error("Published job slug cannot change.");
}

export function removedQuestionIds(
  existing: Pick<JobQuestion, "id" | "archivedAt">[],
  incomingIds: string[],
) {
  const supplied = new Set(incomingIds);
  if (existing.some((q) => q.archivedAt && supplied.has(q.id)))
    throw new Error("Archived questions cannot be restored.");
  return existing.filter((q) => !q.archivedAt && !supplied.has(q.id)).map((q) => q.id);
}

/** Refusal shown verbatim (after requireAdmin) whenever a job still has applications. */
export const jobDeletionBlocked =
  "Jobs with applications cannot be deleted. Close an open job instead to preserve application snapshots, files and history.";

export function checkJobCommand(
  job: Pick<Job, "status" | "publishedAt">,
  command: "close" | "reopen" | "duplicate" | "delete",
  hasApplications: boolean,
) {
  // Any status may be hard-deleted only while the job has zero applications.
  // Deletion never rewrites a slug, so the published-slug immutability rule
  // and its DB trigger stay intact; the admin confirms this explicitly.
  if (command === "delete" && hasApplications) throw new Error(jobDeletionBlocked);
  if (command === "close" && job.status !== "open")
    throw new Error("Only open jobs can be closed.");
  if (command === "reopen" && job.status !== "closed")
    throw new Error("Only closed jobs can be reopened.");
}
