import type { Application } from "@/db/schema";
import {
  employmentTypeEnum,
  experienceLevelEnum,
  jobStatusEnum,
  sectorEnum,
  workModeEnum,
} from "@/db/schema";

const dhakaDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka", day: "numeric", month: "short", year: "numeric",
  hour: "numeric", minute: "2-digit", hourCycle: "h12",
});
/** Identical server/client text, independent of machine locale/timezone. */
export function formatAdminDate(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (!Number.isFinite(date.getTime())) return "Date unavailable";
  const parts = Object.fromEntries(dhakaDate.formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.day} ${parts.month.replace("Sept", "Sep")} ${parts.year}, ${Number(parts.hour)}:${parts.minute} ${parts.dayPeriod.toUpperCase()}`;
}
export const applicationStatusLabels: Record<Application["status"], string> = {
  new: "New", under_review: "Under review", shortlisted: "Shortlisted", rejected: "Rejected", hired: "Hired",
};
export function applicationStatusLabel(status: Application["status"]) { return applicationStatusLabels[status]; }
export const employmentTypeLabels: Record<(typeof employmentTypeEnum.enumValues)[number], string> = {
  full_time: "Full time", part_time: "Part time", contract: "Contract", internship: "Internship", freelance: "Freelance",
};
export const workModeLabels: Record<(typeof workModeEnum.enumValues)[number], string> = {
  onsite: "On-site", remote: "Remote", hybrid: "Hybrid",
};
export const sectorLabels: Record<(typeof sectorEnum.enumValues)[number], string> = {
  creative_agency: "Creative agency", real_estate: "Real estate", fashion: "Fashion", saas: "SaaS",
  media: "Media", technology: "Technology", other: "Other",
};
export const experienceLevelLabels: Record<(typeof experienceLevelEnum.enumValues)[number], string> = {
  entry: "Entry", mid: "Mid", senior: "Senior",
};
export const jobStatusLabels: Record<(typeof jobStatusEnum.enumValues)[number], string> = {
  draft: "Draft", open: "Open", closed: "Closed",
};
