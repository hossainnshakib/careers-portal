import type { loadReviewDashboard } from "@/db/queries/review";
import { StatusBadge } from "./status-badge";
import { ViewerDate } from "./viewer-date";
import { BrandMarks } from "./brand-mark";
import { snapshotAccent } from "@/lib/brands/contrast";

type Row = Awaited<ReturnType<typeof loadReviewDashboard>>["latest"][number];
type Accent = { name: string; accentColor: string | null; logoUrl?: string | null };

/**
 * Latest applications / applications results, styled as the mockup table.
 * Explicit ARIA roles keep table semantics valid at mobile widths, where the
 * CSS turns each row into a stacked card.
 */
export function ApplicationTable({ rows, brandAccents = [], initialsOnly = false }: { rows: Row[]; brandAccents?: Accent[]; initialsOnly?: boolean }) {
  if (!rows.length) return <ApplicationEmptyState />;
  return (
    <div className="admin-table admin-table-rows">
      <table role="table" aria-label="Applications">
        <thead role="rowgroup">
          <tr role="row">
            {["Candidate", "Position", "Brands", "Status", "Applied (Dhaka)"].map((label) => (
              <th key={label} role="columnheader" scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((row) => (
            <tr key={row.id} role="row">
              <td role="cell" className="admin-cell-candidate">
                {row.status === "new" && <span className="admin-dot" aria-hidden="true" />}
                <a href={`/admin/applications/${row.id}`}>
                  <b>{row.fullName}</b>
                </a>
              </td>
              <td role="cell" className="admin-cell-position">
                {row.jobTitle}
              </td>
              <td role="cell" className="admin-cell-brands">
                <BrandMarks
                  initialsOnly={initialsOnly}
                  brands={(row.brandNames ?? []).map((name) => {
                    const matches = brandAccents.filter((item) => item.name === name);
                    const accent = matches.length === 1 ? matches[0] : undefined;
                    return {
                      id: `${row.id}:${name}:${snapshotAccent(name, brandAccents) ?? ""}`,
                      name,
                      accentColor: snapshotAccent(name, brandAccents),
                      logoUrl: accent?.logoUrl ?? null,
                    };
                  })}
                />
              </td>
              <td role="cell" className="admin-cell-status">
                <StatusBadge status={row.status} />
              </td>
              <td role="cell" className="admin-cell-date">
                <ViewerDate iso={row.submittedAt.toISOString()} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ApplicationEmptyState() {
  return (
    <div className="admin-card admin-empty">
      <b>No applications match these filters</b>
      <p className="admin-muted" style={{ margin: 0 }}>
        Try a different name or remove a filter.
      </p>
      {/* Fresh private-document navigation renews authorization and the CSP nonce. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/admin/applications" className="admin-btn">
        Clear filters
      </a>
    </div>
  );
}
