"use client";

import { useRef, useState } from "react";
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
  const labelInput = useRef<HTMLInputElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const [deleting, setDeleting] = useState<OptionRow | null>(null);

  async function run(work: () => Promise<{ ok: boolean; error?: string }>, done: string) {
    setPending(true);
    setMessage("");
    try {
      const result = await work();
      if (result.ok) {
        setMessage(done);
        router.refresh();
        return true;
      } else setMessage(result.error ?? "Unable to update options. Try again.");
    } catch {
      setMessage("Unable to update options. Try again.");
    } finally {
      setPending(false);
    }
    return false;
  }

  const editor = (
      <section aria-label="Option editor" className="admin-card admin-option-editor">
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
          <fieldset disabled={pending} className="admin-fieldset">
          <div className="admin-option-fields">
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
            Label
            <input
              ref={labelInput}
              aria-describedby="option-label-guidance"
              value={draft.label}
              required
              maxLength={40}
              onChange={(event) => {
                const label = event.target.value;
                setDraft({
                  ...draft,
                  label,
                  slug: manualSlug ? draft.slug : slugify(label),
                });
              }}
            />
          </label>
          <label>
            Slug
            <input
              aria-describedby="option-slug-guidance"
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
          </div>
          <p id="option-label-guidance" className="sr-only">Labels are shown exactly as typed.</p>
          <p id="option-slug-guidance" className="sr-only">Slugs are used in filter URLs.</p>
          <div className="admin-option-create-actions">
          <label className="admin-inline" style={{ marginTop: 6 }}>
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
            />
            Active<span className="sr-only"> (available on new jobs and public filters)</span>
          </label>
          <div className="admin-filter-actions" style={{ marginTop: 14 }}>
            <button className="admin-btn" disabled={pending}>
              {pending ? "Saving…" : draft.id ? "Save option" : "Create"}
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
              {draft.id ? "Cancel" : "Clear"}
            </button>
          </div>
          </div>
          </fieldset>
        </form>
        <p role="status" aria-live="polite" className="admin-error">
          {message}
        </p>
      </section>
  );
  return (
    <div className="admin-stack admin-settings-options">
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
                            <Pill tone={row.isActive ? "active" : "rejected"}>
                              {row.isActive ? "Active" : "Inactive"}
                            </Pill>
                          </td>
                          <td role="cell"><span className="admin-settings-count-label">Jobs: </span>{links}</td>
                          <td role="cell" className="admin-cell-actions">
                            <button
                              className="admin-settings-action"
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
                                labelInput.current?.focus();
                              }}
                            >
                              Edit<span className="sr-only"> {row.label}</span>
                            </button>
                            <button
                              className="admin-settings-action"
                              disabled={pending}
                              onClick={() =>
                                void run(
                                  () =>
                                    saveOptionAction({
                                      id: row.id,
                                      group: row.group,
                                      label: row.label,
                                      slug: row.slug,
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
                              className="admin-settings-action"
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
                              className="admin-settings-action"
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
                              className="admin-settings-action"
                              disabled={pending || links > 0}
                              title={links > 0 ? "Used by jobs" : undefined}
                              aria-describedby={links > 0 ? `option-used-${row.id}` : undefined}
                              aria-label={`Delete ${row.label}`}
                              onClick={() => { setDeleting(row); setMessage(""); deleteDialog.current?.showModal(); }}
                            >
                              Delete
                            </button>
                            {links > 0 && <span id={`option-used-${row.id}`} className="sr-only">Used by jobs. Deactivate instead of deleting.</span>}
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
      {editor}
      <dialog ref={deleteDialog} aria-label="Delete option" onCancel={(event) => { if (pending) event.preventDefault(); }} onClose={() => { if (!deleteDialog.current?.open) setDeleting(null); }}>
        <h2>Delete {deleting?.label}?</h2>
        <p>This permanently removes an unused option. Options used by jobs cannot be deleted.</p>
        <div className="admin-publish-actions">
          <button type="button" disabled={pending} className="admin-btn admin-btn-secondary" onClick={() => deleteDialog.current?.close()}>Cancel</button>
          <button type="button" disabled={pending} className="admin-btn admin-btn-danger" onClick={async () => { if (deleting && await run(() => deleteOptionAction({ id: deleting.id }), "Option deleted.")) deleteDialog.current?.close(); }}>{pending ? "Deleting…" : "Delete option"}</button>
        </div>
        {message && <p role="status" className="admin-error">{message}</p>}
      </dialog>
    </div>
  );
}
