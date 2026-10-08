import type { Job, JobQuestion } from "@/db/schema";

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${JSON.stringify(key)}:${canonical(value)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
type Baseline = Pick<
  JobQuestion,
  "id" | "label" | "helpText" | "type" | "required" | "options" | "config" | "section" | "sortOrder"
>;
export function mayUpgradeDemoQuestions(
  job: Pick<Job, "id" | "createdAt" | "updatedAt">,
  expectedJobId: string,
  current: JobQuestion[],
  baseline: Baseline[],
) {
  if (
    job.id !== expectedJobId ||
    job.createdAt.getTime() !== job.updatedAt.getTime() ||
    current.length !== baseline.length
  )
    return false;
  return baseline.every((expected) => {
    const row = current.find((row) => row.id === expected.id);
    if (!row || row.archivedAt) return false;
    return Object.entries(expected).every(
      ([key, value]) => canonical(row[key as keyof JobQuestion]) === canonical(value),
    );
  });
}
