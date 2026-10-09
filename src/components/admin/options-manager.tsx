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

type OptionRow = {
  id: string;
  group: OptionGroup;
  label: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

const inputClass = "mt-1 block w-full rounded border border-input bg-card p-2";
const buttonClass = "rounded border border-border px-3 py-2 disabled:opacity-50";

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
    <div className="space-y-6">
      <form
        className="max-w-xl space-y-4 rounded border border-border bg-card p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void run(() => saveOptionAction(draft), "Option saved.");
        }}
      >
        <h2 className="font-semibold">{draft.id ? "Edit option" : "Create option"}</h2>
        <label className="block">
          Group
          <select
            aria-label="Group"
            className={inputClass}
            value={draft.group}
            disabled={!!draft.id}
            onChange={(event) =>
              setDraft({ ...draft, group: event.target.value as OptionGroup, slug: manualSlug ? draft.slug : "" })
            }
          >
            {optionGroups.map((group) => (
              <option key={group} value={group}>
                {optionGroupLabels[group]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          Label (shown exactly as typed)
          <input
            className={inputClass}
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
        <label className="block">
          Slug (used in filter URLs)
          <input
            className={inputClass}
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
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
          />
          Active (available on new jobs and public filters)
        </label>
        <div className="flex gap-2">
          <button className={buttonClass} disabled={pending}>
            {pending ? "Saving…" : "Save option"}
          </button>
          <button
            className={buttonClass}
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
      <p role="status" aria-live="polite" className="break-words">
        {message}
      </p>
      {optionGroups.map((group) => {
        const groupRows = rows.filter((row) => row.group === group);
        return (
          <section key={group} aria-label={optionGroupLabels[group]}>
            <h2 className="mb-3 text-lg font-semibold">{optionGroupLabels[group]}</h2>
            {groupRows.length === 0 ? (
              <p>No options in this group yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <caption className="sr-only">{optionGroupLabels[group]} options in order</caption>
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-3">Label</th>
                      <th className="p-3">Slug</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Jobs</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupRows.map((row, index) => {
                      const links = counts[row.id] ?? 0;
                      return (
                        <tr key={row.id} className="border-b border-border">
                          <td className="p-3">{row.label}</td>
                          <td className="p-3">{row.slug}</td>
                          <td className="p-3">{row.isActive ? "Active" : "Inactive"}</td>
                          <td className="p-3">{links}</td>
                          <td className="flex flex-wrap gap-2 p-3">
                            <button
                              className={buttonClass}
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
                              className={buttonClass}
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
                              className={buttonClass}
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
                              className={buttonClass}
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
                              className={buttonClass}
                              disabled={pending || links > 0}
                              title={
                                links > 0
                                  ? "Used by jobs — deactivate instead of deleting."
                                  : undefined
                              }
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
