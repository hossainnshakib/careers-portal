"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteOptionAction,
  reorderOptionAction,
  saveOptionAction,
} from "@/app/admin/(protected)/options/actions";
import { optionGroupLabels, optionGroups, type OptionGroup } from "@/lib/careers/option-labels";
import { slugify } from "@/lib/slug";
import type { OptionInput } from "@/lib/validation/options";
import { Pill } from "@/components/admin/status-badge";

type OptionRow = {
  id: string;
  group: OptionGroup;
  label: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

export function OptionsManager({
  rows,
  counts,
}: {
  rows: OptionRow[];
  counts: Record<string, number>;
}) {
  const [draft, setDraft] = useState<OptionInput>({
    id: null,
    group: "arrangement",
    label: "",
    slug: "",
    isActive: true,
  });
  const [manualSlug, setManualSlug] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function run(work: () => Promise<{ ok: boolean; error?: string }>, done: string) {
    setPending(true);
    setMessage("");
    try {
      const result = await work();
      if (result.ok) {
        setMessage(done);
        router.refresh();
      } else setMessage(result.error ?? "Unable to update options. Try again.");
    } catch {
      setMessage("Unable to update options. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-stack">
      <div className="admin-card" style={{ maxWidth: 520 }}>
        <h2 className="admin-kicker" style={{ margin: 0 }}>
          {draft.id ? "Edit option" : "Create option"}
        </h2>
        <form
          style={{ marginTop: 12 }}
          onSubmit={(event) => {
            event.preventDefault();
            void run(() => saveOptionAction(draft), "Option saved.");
          }}
        >
          <label>
            Group
            <select
              aria-label="Group"
              value={draft.group}
              disabled={!!draft.id}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  group: event.target.value as OptionGroup,
                  slug: manualSlug ? draft.slug : "",
                })
              }
            >
              {optionGroups.map((group) => (
                <option key={group} value={group}>
                  {optionGroupLabels[group]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Label (shown exactly as typed)
            <input
              value={draft.label}
              required
              maxLength={40}
              onChange={(event) => {
                const label = event.target.value;
                setDraft({
                  ...draft,
                  label,
                  slug: manualSlug && draft.id ? draft.slug : slugify(label) || draft.slug,
                });
              }}
            />
          </label>
          <label>
            Slug (used in filter URLs)
            <input
              value={draft.slug}
              required
              maxLength={120}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              onChange={(event) => {
                setManualSlug(true);
                setDraft({ ...draft, slug: event.target.value });
              }}
            />
          </label>
          <label className="admin-inline" style={{ marginTop: 6 }}>
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
            />
            Active (available on new jobs and public filters)
          </label>
          <div className="admin-filter-actions" style={{ marginTop: 14 }}>
            <button className="admin-btn" disabled={pending}>
              {pending ? "Saving…" : "Save option"}
            </button>
            <button
              className="admin-btn admin-btn-secondary"
              type="button"
              disabled={pending}
              onClick={() => {
                setManualSlug(false);
                setDraft({ id: null, group: "arrangement", label: "", slug: "", isActive: true });
              }}
            >
              Clear
            </button>
          </div>
        </form>
        <p role="status" aria-live="polite" className="admin-error">
          {message}
        </p>
      </div>

      {optionGroups.map((group) => {
        const groupRows = rows.filter((row) => row.group === group);
        return (
          <section key={group} aria-label={optionGroupLabels[group]} className="admin-card">
            <h2 className="admin-kicker" style={{ margin: 0 }}>
              {optionGroupLabels[group]}
            </h2>
            {groupRows.length === 0 ? (
              <p className="admin-muted" style={{ margin: "10px 0 0" }}>
                No options in this group yet.
              </p>
            ) : (
              <div className="admin-table admin-table-options" style={{ marginTop: 10 }}>
                <table role="table" aria-label={`${optionGroupLabels[group]} options in order`}>
                  <thead role="rowgroup">
                    <tr role="row">
                      {["Label", "Slug", "Status", "Jobs", "Actions"].map((label) => (
                        <th key={label} role="columnheader" scope="col">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody role="rowgroup">
                    {groupRows.map((row, index) => {
                      const links = counts[row.id] ?? 0;
                      return (
                        <tr key={row.id} role="row">
                          <td role="cell" className="admin-cell-title">
                            <b>{row.label}</b>
                          </td>
                          <td role="cell" className="admin-muted">
                            {row.slug}
                          </td>
                          <td role="cell" className="admin-cell-status">
                            <Pill tone={row.isActive ? "active" : "inactive"}>
                              {row.isActive ? "Active" : "Inactive"}
                            </Pill>
                          </td>
                          <td role="cell">{links}</td>
                          <td role="cell" className="admin-cell-actions">
                            <button
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                              disabled={pending}
                              onClick={() => {
                                setManualSlug(true);
                                setDraft({
                                  id: row.id,
                                  group: row.group,
                                  label: row.label,
                                  slug: row.slug,
                                  isActive: row.isActive,
                                });
                              }}
                            >
                              Edit<span className="sr-only"> {row.label}</span>
                            </button>
                            <button
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                              disabled={pending}
                              onClick={() =>
                                void run(
                                  () =>
                                    saveOptionAction({
                                      ...row,
                                      id: row.id,
                                      isActive: !row.isActive,
                                    }),
                                  row.isActive ? "Option deactivated." : "Option activated.",
                                )
                              }
                            >
                              {row.isActive ? "Deactivate" : "Activate"}
                              <span className="sr-only"> {row.label}</span>
                            </button>
                            <button
                              className="admin-btn admin-btn-secondary admin-icon-btn"
                              disabled={pending || index === 0}
                              aria-label={`Move ${row.label} up`}
                              onClick={() =>
                                void run(
                                  () => reorderOptionAction({ id: row.id, direction: "up" }),
                                  "Option moved up.",
                                )
                              }
                            >
                              ↑
                            </button>
                            <button
                              className="admin-btn admin-btn-secondary admin-icon-btn"
                              disabled={pending || index === groupRows.length - 1}
                              aria-label={`Move ${row.label} down`}
                              onClick={() =>
                                void run(
                                  () => reorderOptionAction({ id: row.id, direction: "down" }),
                                  "Option moved down.",
                                )
                              }
                            >
                              ↓
                            </button>
                            <button
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                              disabled={pending || links > 0}
                              title={links > 0 ? "Used by jobs" : undefined}
                              aria-label={`Delete ${row.label}`}
                              onClick={() =>
                                void run(() => deleteOptionAction({ id: row.id }), "Option deleted.")
                              }
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
