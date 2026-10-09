"use client";

import { useEffect, useState } from "react";
import {
  employmentTypeEnum,
  experienceLevelEnum,
  workModeEnum,
  type Brand,
  type Department,
} from "@/db/schema";
import { jobInput, type JobInput } from "@/lib/validation/jobs";
import { employmentTypeLabels, experienceLevelLabels, jobStatusLabels, workModeLabels } from "@/lib/admin/display";
import { slugify } from "@/lib/slug";
import { SafeMarkdown } from "@/lib/markdown/render";
import { jobCommandAction, saveJobAction } from "@/app/admin/(protected)/jobs/actions";
import { QuestionBuilder } from "./question-builder";
import { CandidatePreview } from "./candidate-preview";

const inputClass = "mt-1 block w-full rounded border border-input bg-card p-2";
const buttonClass = "rounded border border-border px-4 py-2 disabled:opacity-50";
function localDateTime(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export type JobEditorProps = {
  initial: JobInput;
  brands: Brand[];
  departments: Department[];
  sources: { id: string; title: string }[];
  published: boolean;
  status: "draft" | "open" | "closed";
  hasApplications: boolean;
  archivedLabels?: string[];
};
export function JobEditor({
  initial,
  brands,
  departments,
  sources,
  published,
  status,
  hasApplications,
  archivedLabels = [],
}: JobEditorProps) {
  const [draft, setDraft] = useState(initial);
  const [manualSlug, setManualSlug] = useState(!!initial.id);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  function field<K extends keyof JobInput>(name: K, value: JobInput[K]) {
    setDraft((current) => ({ ...current, [name]: value }));
  }
  async function save(intent: "save" | "publish") {
    setMessage("");
    const parsed = jobInput.safeParse({ ...draft, intent });
    if (!parsed.success) {
      setMessage(
        parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
      );
      return;
    }
    setPending(true);
    try {
      const result = await saveJobAction(parsed.data);
      if (!result.ok) setMessage(result.error);
      else {
        setMessage("Job saved.");
        if (draft.id) window.location.reload();
        else window.location.replace(`/admin/jobs/${result.data.id}/edit`);
      }
    } catch {
      setMessage("Unable to save job. Try again.");
    } finally {
      setPending(false);
    }
  }
  async function command(command: "close" | "reopen" | "duplicate" | "delete") {
    if (!draft.id) return;
    setPending(true);
    setMessage("");
    try {
      const result = await jobCommandAction({ id: draft.id, command });
      if (!result.ok) setMessage(result.error);
      else {
        if (command === "delete") window.location.assign("/admin/jobs");
        else if (command === "duplicate") window.location.assign(`/admin/jobs/${result.data.id}/edit`);
        else window.location.reload();
      }
    } catch {
      setMessage("Unable to update job. Try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">{draft.id ? "Edit job" : "Create job"}</h1>
      <p>Status: {jobStatusLabels[status]}</p>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save("save");
        }}
      >
        <fieldset disabled={pending} className="space-y-6">
          <section
            aria-labelledby="job-basics"
            className="rounded border border-border bg-card p-5"
          >
            <h2 id="job-basics" className="mb-4 text-xl font-semibold">
              1. Basics
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                Title
                <input
                  className={inputClass}
                  value={draft.title}
                  maxLength={200}
                  required
                  onChange={(event) => {
                    const title = event.target.value;
                    setDraft({
                      ...draft,
                      title,
                      slug: !published && !manualSlug ? slugify(title) : draft.slug,
                    });
                  }}
                />
              </label>
              <label>
                Slug
                <input
                  className={inputClass}
                  value={draft.slug}
                  aria-label="Slug"
                  maxLength={120}
                  required
                  readOnly={published}
                  onChange={(event) => {
                    setManualSlug(true);
                    field("slug", event.target.value);
                  }}
                />
                <span className="text-sm">
                  {published
                    ? "Locked after first publication."
                    : "Editable until first publication."}
                </span>
              </label>
              <label>
                Department
                <select
                  aria-label="Department"
                  className={inputClass}
                  value={draft.departmentId}
                  onChange={(event) => field("departmentId", event.target.value)}
                >
                  {departments.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                      {row.isActive ? "" : " (inactive)"}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Primary brand
                <select
                  aria-label="Primary brand"
                  className={inputClass}
                  value={draft.primaryBrandId}
                  onChange={(event) => field("primaryBrandId", event.target.value)}
                >
                  {brands
                    .filter((brand) => draft.brandIds.includes(brand.id))
                    .map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                </select>
              </label>
              <fieldset className="md:col-span-2">
                <legend>Brands (select one or more)</legend>
                <div className="flex flex-wrap gap-4">
                  {brands.map((brand) => (
                    <label key={brand.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={draft.brandIds.includes(brand.id)}
                        onChange={(event) => {
                          const ids = event.target.checked
                            ? [...draft.brandIds, brand.id]
                            : draft.brandIds.filter((id) => id !== brand.id);
                          setDraft({
                            ...draft,
                            brandIds: ids,
                            primaryBrandId: ids.includes(draft.primaryBrandId)
                              ? draft.primaryBrandId
                              : (ids[0] ?? ""),
                          });
                        }}
                      />
                      {brand.name}
                      {brand.status === "hidden" ? " (hidden)" : ""}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label>
                Employment type
                <select
                  aria-label="Employment type"
                  className={inputClass}
                  value={draft.employmentType}
                  onChange={(event) =>
                    field("employmentType", event.target.value as JobInput["employmentType"])
                  }
                >
                  {employmentTypeEnum.enumValues.map((value) => (
                    <option key={value} value={value}>
                      {employmentTypeLabels[value]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Work mode
                <select
                  aria-label="Work mode"
                  className={inputClass}
                  value={draft.workMode}
                  onChange={(event) =>
                    field("workMode", event.target.value as JobInput["workMode"])
                  }
                >
                  {workModeEnum.enumValues.map((value) => (
                    <option key={value} value={value}>{workModeLabels[value]}</option>
                  ))}
                </select>
              </label>
              <label>
                Experience level
                <select
                  aria-label="Experience level"
                  className={inputClass}
                  value={draft.experienceLevel ?? ""}
                  onChange={(event) =>
                    field(
                      "experienceLevel",
                      event.target.value
                        ? (event.target.value as NonNullable<JobInput["experienceLevel"]>)
                        : null,
                    )
                  }
                >
                  <option value="">Not specified</option>
                  {experienceLevelEnum.enumValues.map((value) => (
                    <option key={value} value={value}>{experienceLevelLabels[value]}</option>
                  ))}
                </select>
              </label>
              <label>
                Location
                <input
                  className={inputClass}
                  value={draft.locationText}
                  maxLength={300}
                  onChange={(event) => field("locationText", event.target.value)}
                />
              </label>
              <label>
                Deadline (your local time)
                <input
                  aria-label="Deadline"
                  className={inputClass}
                  type="datetime-local"
                  value={mounted ? localDateTime(draft.deadlineAt) : ""}
                  onChange={(event) =>
                    field(
                      "deadlineAt",
                      event.target.value ? new Date(event.target.value).toISOString() : null,
                    )
                  }
                />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.cvRequired}
                  onChange={(event) => field("cvRequired", event.target.checked)}
                />
                CV required
              </label>
            </div>
          </section>
          <section
            aria-labelledby="job-content"
            className="space-y-4 rounded border border-border bg-card p-5"
          >
            <h2 id="job-content" className="text-xl font-semibold">
              2. Content
            </h2>
            <label className="block">
              Summary
              <textarea
                aria-label="Summary"
                className={inputClass}
                value={draft.summary}
                maxLength={200}
                onChange={(event) => field("summary", event.target.value)}
              />
              <span>{draft.summary.length}/200</span>
            </label>
            {(
              [
                ["descriptionMd", "Description"],
                ["responsibilitiesMd", "Responsibilities"],
                ["requirementsMd", "Requirements"],
              ] as const
            ).map(([name, label]) => (
              <div key={name} className="grid gap-4 md:grid-cols-2">
                <label>
                  {label} (Markdown)
                  <textarea
                    aria-label={`${label} (Markdown)`}
                    rows={6}
                    className={inputClass}
                    value={draft[name]}
                    maxLength={50000}
                    onChange={(event) => field(name, event.target.value)}
                  />
                </label>
                <section
                  aria-label={`${label} preview`}
                  className="rounded border border-border p-4"
                >
                  <h3 className="mb-3 font-semibold">{label} preview</h3>
                  <SafeMarkdown text={draft[name]} />
                </section>
              </div>
            ))}
          </section>
          <QuestionBuilder
            questions={draft.questions}
            onChange={(questions) => field("questions", questions)}
            sources={sources.filter((source) => source.id !== draft.id)}
            hasApplications={hasApplications}
          />
          <section>
            {archivedLabels.length > 0 && (
              <details>
                <summary>Archived questions ({archivedLabels.length})</summary>
                <ul>
                  {archivedLabels.map((label, index) => (
                    <li key={index}>{label}</li>
                  ))}
                </ul>
              </details>
            )}
          </section>
          <CandidatePreview questions={draft.questions} cvRequired={draft.cvRequired} />
          <div className="flex flex-wrap gap-3">
            <button className={buttonClass} disabled={pending}>
              {draft.id ? "Save changes" : "Save draft"}
            </button>
            {status !== "open" && (
              <button className={buttonClass} type="button" onClick={() => void save("publish")}>
                Publish job
              </button>
            )}
            {draft.id && (
              <>
                <button
                  className={buttonClass}
                  type="button"
                  onClick={() => void command("duplicate")}
                >
                  Duplicate job
                </button>
                {status === "open" && (
                  <button
                    className={buttonClass}
                    type="button"
                    onClick={() => void command("close")}
                  >
                    Close job
                  </button>
                )}
                {status === "closed" && (
                  <button
                    className={buttonClass}
                    type="button"
                    onClick={() => void command("reopen")}
                  >
                    Reopen job
                  </button>
                )}
                {!published && !hasApplications && (
                  <button
                    className={buttonClass}
                    type="button"
                    onClick={() => void command("delete")}
                  >
                    Delete draft
                  </button>
                )}
              </>
            )}
          </div>
        </fieldset>
      </form>
      <p role="status" aria-live="polite" className="break-words">
        {message}
      </p>
    </section>
  );
}
