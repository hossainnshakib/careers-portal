import Link from "next/link";
import type { loadReviewDashboard } from "@/db/queries/review";
import { StatusBadge } from "./status-badge";
import { ViewerDate } from "./viewer-date";

export function ApplicationTable({ rows }: { rows: Awaited<ReturnType<typeof loadReviewDashboard>>["latest"] }) {
  if (!rows.length) return <p className="rounded border border-border p-6">No applications match these filters.</p>;
  return <div className="overflow-x-auto rounded border border-border">
    <table className="w-full text-left text-sm">
      <caption className="sr-only">Applications</caption>
      <thead className="bg-secondary"><tr>
        {["Candidate", "Position / brands", "Status", "Applied", "Reference"].map((label) => <th key={label} className="p-3">{label}</th>)}
      </tr></thead>
      <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-border hover:bg-secondary/50">
        <td className="p-3"><Link href={`/admin/applications/${row.id}`} className="font-semibold underline">{row.fullName}</Link><p className="mt-1 break-all text-muted-foreground">{row.email}</p></td>
        <td className="p-3"><Link href={`/admin/applications/${row.id}`}>{row.jobTitle}</Link><p className="mt-1 text-muted-foreground">{(row.brandNames ?? []).join(" · ")}</p><p className="text-muted-foreground">{row.department}</p></td>
        <td className="p-3"><StatusBadge status={row.status} /></td>
        <td className="whitespace-nowrap p-3"><ViewerDate iso={row.submittedAt.toISOString()} /></td>
        <td className="p-3"><Link href={`/admin/applications/${row.id}`} className="underline">{row.reference}</Link></td>
      </tr>)}</tbody>
    </table>
  </div>;
}
