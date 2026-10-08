import type { Application } from "@/db/schema";

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
