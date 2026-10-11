import type { Application, Job } from "@/db/schema";
import { applicationStatusLabel, jobStatusLabels } from "@/lib/admin/display";

const applicationTone: Record<Application["status"], string> = {
  new: "new",
  under_review: "review",
  shortlisted: "shortlisted",
  rejected: "rejected",
  hired: "hired",
};

const jobTone: Record<Job["status"], string> = {
  open: "open",
  draft: "review",
  closed: "closed",
};

export function Pill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`admin-pill admin-pill-${tone}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: Application["status"] }) {
  return <Pill tone={applicationTone[status]}>{applicationStatusLabel(status)}</Pill>;
}

export function JobStatusBadge({ status }: { status: Job["status"] }) {
  return <Pill tone={jobTone[status]}>{jobStatusLabels[status]}</Pill>;
}
