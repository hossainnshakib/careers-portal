"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Department } from "@/db/schema";
import {
  reorderDepartmentAction,
  saveDepartmentAction,
} from "@/app/admin/(protected)/departments/actions";
import type { DepartmentInput } from "@/lib/validation/departments";
import { Pill } from "@/components/admin/status-badge";

const blank: DepartmentInput = { id: null, name: "", slug: "", isActive: true };

export function DepartmentManager({
  rows,
  counts = {},
}: {
  rows: Department[];
  counts?: Record<string, number>;
}) {
  const [draft, setDraft] = useState<DepartmentInput>(blank);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function reorder(id: string, direction: "up" | "down") {
    setPending(true);
    setMessage("");
    try {
      const result = await reorderDepartmentAction({ id, direction });
      if (result.ok) router.refresh();
      else setMessage(result.error);
    } catch {
      setMessage("Unable to reorder. Try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="admin-grid admin-grid-settings">
      <div className="admin-card">
        <h2 className="admin-kicker" style={{ margin: 0 }}>
          Departments in display order
        </h2>
        {rows.length === 0 ? (
          <div className="admin-empty" style={{ marginTop: 12 }}>
            <b>No departments yet.</b>
            <p className="admin-muted" style={{ margin: 0 }}>
              Create the first department in the panel.
            </p>
          </div>
        ) : (
          <div className="admin-table admin-table-depts" style={{ marginTop: 10 }}>
            <table role="table" aria-label="Departments in display order">
              <thead role="rowgroup">
                <tr role="row">
                  {["Name", "Slug", "Active", "Roles", "Order"].map((label) => (
                    <th key={label} role="columnheader" scope="col">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody role="rowgroup">
                {rows.map((row, index) => (
                  <tr key={row.id} role="row">
                    <td role="cell" className="admin-cell-title">
                      <b>{row.name}</b>
                    </td>
                    <td role="cell" className="admin-muted">
                      {row.slug}
                    </td>
                    <td role="cell" className="admin-cell-status">
                      <Pill tone={row.isActive ? "active" : "inactive"}>
                        {row.isActive ? "Active" : "Inactive"}
                      </Pill>
                    </td>
                    <td role="cell">{counts[row.id] ?? 0}</td>
                    <td role="cell" className="admin-cell-actions">
                      <button
                        className="admin-btn admin-btn-secondary admin-icon-btn"
                        disabled={pending || index === 0}
                        aria-label={`Move ${row.name} up`}
                        onClick={() => reorder(row.id, "up")}
                      >
                        ↑
                      </button>
                      <button
                        className="admin-btn admin-btn-secondary admin-icon-btn"
                        disabled={pending || index === rows.length - 1}
                        aria-label={`Move ${row.name} down`}
                        onClick={() => reorder(row.id, "down")}
                      >
                        ↓
                      </button>
                      <button
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        disabled={pending}
                        onClick={() =>
                          setDraft({
                            id: row.id,
                            name: row.name,
                            slug: row.slug,
                            isActive: row.isActive,
                          })
                        }
                      >
                        Edit<span className="sr-only"> {row.name}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-card">
        <h2 className="admin-kicker" style={{ margin: 0 }}>
          {draft.id ? "Edit department" : "Create department"}
        </h2>
        <form
          style={{ marginTop: 12 }}
          onSubmit={async (event) => {
            event.preventDefault();
            setPending(true);
            setMessage("");
            try {
              const result = await saveDepartmentAction(draft);
              if (result.ok) {
                setDraft(blank);
                setMessage("Department saved.");
                router.refresh();
              } else setMessage(result.error);
            } catch {
              setMessage("Unable to save. Try again.");
            } finally {
              setPending(false);
            }
          }}
        >
          <label>
            Name
            <input
              value={draft.name}
              required
              maxLength={150}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </label>
          <label>
            Slug
            <input
              value={draft.slug}
              required
              maxLength={120}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
            />
          </label>
          <label className="admin-inline" style={{ marginTop: 6 }}>
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
            />
            Active
          </label>
          <div className="admin-filter-actions" style={{ marginTop: 14 }}>
            <button className="admin-btn" disabled={pending}>
              {pending ? "Saving…" : "Save department"}
            </button>
            <button
              className="admin-btn admin-btn-secondary"
              type="button"
              disabled={pending}
              onClick={() => setDraft(blank)}
            >
              Clear
            </button>
          </div>
        </form>
        <p role="status" aria-live="polite" className="admin-error">
          {message}
        </p>
      </div>
    </div>
  );
}
