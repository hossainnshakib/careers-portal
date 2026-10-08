"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Department } from "@/db/schema";
import {
  reorderDepartmentAction,
  saveDepartmentAction,
} from "@/app/admin/(protected)/departments/actions";
import type { DepartmentInput } from "@/lib/validation/departments";

const blank: DepartmentInput = { id: null, name: "", slug: "", isActive: true };
const inputClass = "mt-1 block w-full rounded border border-input bg-card p-2";
const buttonClass = "rounded border border-border px-3 py-2 disabled:opacity-50";

export function DepartmentManager({ rows }: { rows: Department[] }) {
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
    <div className="space-y-6">
      <form
        className="max-w-xl space-y-4 rounded border border-border bg-card p-5"
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
        <h2 className="font-semibold">{draft.id ? "Edit department" : "Create department"}</h2>
        <label className="block">
          Name
          <input
            className={inputClass}
            value={draft.name}
            required
            maxLength={150}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
        </label>
        <label className="block">
          Slug
          <input
            className={inputClass}
            value={draft.slug}
            required
            maxLength={120}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
          />
          Active
        </label>
        <div className="flex gap-2">
          <button className={buttonClass} disabled={pending}>
            {pending ? "Saving…" : "Save department"}
          </button>
          <button
            className={buttonClass}
            type="button"
            disabled={pending}
            onClick={() => setDraft(blank)}
          >
            Clear
          </button>
        </div>
      </form>
      <p role="status" aria-live="polite">
        {message}
      </p>
      {rows.length === 0 ? (
        <p>No departments yet. Create the first department above.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">Departments in display order</caption>
            <thead>
              <tr className="border-b border-border">
                <th className="p-3">Name</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className="border-b border-border">
                  <td className="p-3">{row.name}</td>
                  <td className="p-3">{row.slug}</td>
                  <td className="p-3">{row.isActive ? "Active" : "Inactive"}</td>
                  <td className="flex gap-2 p-3">
                    <button
                      className={buttonClass}
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
                    <button
                      className={buttonClass}
                      disabled={pending || index === 0}
                      aria-label={`Move ${row.name} up`}
                      onClick={() => reorder(row.id, "up")}
                    >
                      ↑
                    </button>
                    <button
                      className={buttonClass}
                      disabled={pending || index === rows.length - 1}
                      aria-label={`Move ${row.name} down`}
                      onClick={() => reorder(row.id, "down")}
                    >
                      ↓
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
