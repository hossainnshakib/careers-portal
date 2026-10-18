"use client";

import { useEffect, useState } from "react";

type Department = { departmentId: string; name: string; count: number };

export function DashboardDepartments({ rows }: { rows: Department[] }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 800px)");
    const adapt = () => setOpen(!mobile.matches);
    adapt();
    mobile.addEventListener("change", adapt);
    return () => mobile.removeEventListener("change", adapt);
  }, []);
  const maximum = Math.max(1, ...rows.map((row) => row.count));
  return (
    <details className="admin-card admin-dashboard-departments" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary><h2 className="admin-kicker">Open roles by department</h2></summary>
      <div>
        {rows.length === 0 && <p className="admin-note">No open roles yet.</p>}
        {rows.map((row) => (
          <div key={row.departmentId} className="admin-department-bar">
            <div className="admin-bar-row"><span>{row.name}</span><b>{row.count}</b></div>
            <div className="admin-bar" aria-hidden="true"><i style={{ width: `${Math.round((row.count / maximum) * 100)}%` }} /></div>
          </div>
        ))}
      </div>
    </details>
  );
}
