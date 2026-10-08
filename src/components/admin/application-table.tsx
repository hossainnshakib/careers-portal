import type { loadReviewDashboard } from "@/db/queries/review";
import { StatusBadge } from "./status-badge";
import { ViewerDate } from "./viewer-date";
import { BrandDot } from "@/components/brand-dot";
import { snapshotAccent } from "@/lib/brands/contrast";

export function ApplicationTable({ rows, brandAccents = [] }: { rows: Awaited<ReturnType<typeof loadReviewDashboard>>["latest"]; brandAccents?: { name: string; accentColor: string | null }[] }) {
  if (!rows.length) return <p className="rounded border border-border p-6">No applications match these filters.</p>;
  return <div className="overflow-x-auto rounded border border-border">
    <table className="w-full text-left text-sm">
      <caption className="sr-only">Applications</caption>
      <thead className="bg-secondary"><tr>
        {["Candidate", "Position / brands", "Status", "Applied", "Reference"].map((label) => <th key={label} className="p-3">{label}</th>)}
      </tr></thead>
      <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-border hover:bg-secondary/50">
        <td className="p-3"><a href={`/admin/applications/${row.id}`} className="font-semibold underline">{row.fullName}</a><p className="mt-1 break-all text-muted-foreground">{row.email}</p></td>
        <td className="p-3"><a href={`/admin/applications/${row.id}`}>{row.jobTitle}</a><div className="mt-1 flex flex-wrap gap-3 text-muted-foreground">{(row.brandNames ?? []).map((name, index) => <span key={`${name}:${index}`} className="inline-flex items-center gap-2"><BrandDot color={snapshotAccent(name, brandAccents)} />{name}</span>)}</div><p className="text-muted-foreground">{row.department}</p></td>
        <td className="p-3"><StatusBadge status={row.status} /></td>
        <td className="whitespace-nowrap p-3"><ViewerDate iso={row.submittedAt.toISOString()} /></td>
        <td className="p-3"><a href={`/admin/applications/${row.id}`} className="underline">{row.reference}</a></td>
      </tr>)}</tbody>
    </table>
  </div>;
}
