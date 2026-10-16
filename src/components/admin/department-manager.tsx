"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Department } from "@/db/schema";
import {
  reorderDepartmentAction,
  saveDepartmentAction,
} from "@/app/admin/(protected)/departments/actions";
import type { DepartmentInput } from "@/lib/validation/departments";
import { Pill } from "@/components/admin/status-badge";
import { slugify } from "@/lib/slug";

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
  const settings = useRef<HTMLDetailsElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const [manualSlug, setManualSlug] = useState(false);
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
    <section aria-label="Departments" className="admin-card admin-settings-departments">
        <h2 className="admin-kicker" style={{ margin: 0 }}>
          Departments
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
                        <Pill tone={row.isActive ? "active" : "rejected"}>
                        {row.isActive ? "Active" : "Inactive"}
                      </Pill>
                    </td>
                    <td role="cell"><span className="admin-settings-count-label">Roles: </span>{counts[row.id] ?? 0}</td>
                    <td role="cell" className="admin-cell-actions">
                      <button
                        className="admin-settings-action"
                        disabled={pending || index === 0}
                        aria-label={`Move ${row.name} up`}
                        onClick={() => reorder(row.id, "up")}
                      >
                        ↑
                      </button>
                      <button
                        className="admin-settings-action"
                        disabled={pending || index === rows.length - 1}
                        aria-label={`Move ${row.name} down`}
                        onClick={() => reorder(row.id, "down")}
                      >
                        ↓
                      </button>
                      <button
                        className="admin-settings-action"
                        disabled={pending}
                        onClick={() => {
                          setManualSlug(true); setMessage("");
                          if (settings.current) settings.current.open = true;
                          setDraft({
                            id: row.id,
                            name: row.name,
                            slug: row.slug,
                            isActive: row.isActive,
                          }); nameInput.current?.focus();
                        }}
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
                setManualSlug(false);
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
          <fieldset disabled={pending} className="admin-fieldset">
          <div className="admin-department-add">
          <label>
            <span className="sr-only">Name</span>
            <input
              ref={nameInput}
              placeholder={draft.id ? "Department name" : "New department"}
              value={draft.name}
              required
              maxLength={150}
              onChange={(event) => setDraft({ ...draft, name: event.target.value, slug: manualSlug ? draft.slug : slugify(event.target.value) })}
            />
          </label>
          <button className="admin-btn" disabled={pending} aria-label={draft.id ? "Save department" : "Add department"}>{pending ? "Saving…" : draft.id ? "Save" : "Add"}</button>
          </div>
          <details ref={settings} className="admin-department-settings"><summary>{draft.id ? "Edit department settings" : "Additional settings"}</summary>
          <label>
            Slug
            <input
              value={draft.slug}
              required
              maxLength={120}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              onChange={(event) => { setManualSlug(true); setDraft({ ...draft, slug: event.target.value }); }}
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
            <button
              className="admin-btn admin-btn-secondary"
              type="button"
              disabled={pending}
              onClick={() => { setDraft(blank); setManualSlug(false); setMessage(""); }}
            >
              {draft.id ? "Cancel" : "Clear"}
            </button>
          </div>
          </details>
          </fieldset>
        </form>
        <p role="status" aria-live="polite" className="admin-error">
          {message}
        </p>
    </section>
  );
}
