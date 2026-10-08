import type { Application } from "@/db/schema";
import { applicationStatusLabel } from "@/lib/admin/display";

const colors: Record<Application["status"], string> = {
  new: "bg-blue-100 text-blue-900",
  under_review: "bg-amber-100 text-amber-900",
  shortlisted: "bg-violet-100 text-violet-900",
  rejected: "bg-red-100 text-red-900",
  hired: "bg-green-100 text-green-900",
};
export function StatusBadge({ status }: { status: Application["status"] }) {
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${colors[status]}`}>
    {status === "new" ? "● New" : applicationStatusLabel(status)}
  </span>;
}
