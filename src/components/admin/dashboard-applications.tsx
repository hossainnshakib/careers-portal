"use client";

import { useState } from "react";
import type { loadReviewDashboard } from "@/db/queries/review";
import { ApplicationTable } from "./application-table";

type Dashboard = Awaited<ReturnType<typeof loadReviewDashboard>>;

export function DashboardApplications({ rows, brandAccents }: { rows: Dashboard["latest"]; brandAccents: Dashboard["brandAccents"] }) {
  const [expanded, setExpanded] = useState(false);
  if (rows.length === 0) return (
    <div className="admin-empty">
      <b>No applications yet</b>
      <p className="admin-muted" style={{ margin: 0 }}>New applications will appear here.</p>
    </div>
  );
  return (
    <div className={`admin-latest-applications${expanded ? " is-expanded" : ""}`}>
      <ApplicationTable rows={rows} brandAccents={brandAccents} initialsOnly />
      {rows.length > 3 && (
        <button
          type="button"
          className={`admin-latest-toggle admin-link${rows.length <= 6 ? " is-mobile-only" : ""}`}
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show fewer applications" : `Show all ${rows.length} latest applications`}
        </button>
      )}
    </div>
  );
}
