"use client";

import { useEffect, useState } from "react";
import type { Brand, Department } from "@/db/schema";
import { jobInput, missingPublishGroups, type JobInput } from "@/lib/validation/jobs";
import {
  optionGroupLabels,
  optionGroups,
  optionLabel,
  type OptionGroup,
} from "@/lib/careers/option-labels";
import { slugify } from "@/lib/slug";
import { SafeMarkdown } from "@/lib/markdown/render";
import { jobCommandAction, saveJobAction } from "@/app/admin/(protected)/jobs/actions";
import { QuestionBuilder } from "./question-builder";
import { CandidatePreview } from "./candidate-preview";
import { AdminToolbar } from "./admin-toolbar";
import { JobStatusBadge } from "./status-badge";

function localDateTime(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export type EditorOption = {
  id: string;
  group: OptionGroup;
  label: string;
  slug: string;
  isActive: boolean;
};

/** Skills / benefits as the mockup chip input: type + Enter adds, × removes. */
function ChipInput({
  label,
  values,
  max,
  maxLength,
  placeholder,
  onValues,
}: {
  label: string;
  values: string[];
  max: number;
  maxLength: number;
  placeholder: string;
  onValues: (values: string[]) => void;
}) {
  const [text, setText] = useState("");
  function add(raw: string) {
    const items = raw
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, max);
    const next = [...values];
    for (const item of items) if (!next.includes(item)) next.push(item);
    onValues(next.slice(0, max));
    setText("");
  }
  return (
    <div>
      <span className="admin-kicker is-muted">{label}</span>
      <input
        aria-label={label}
        value={text}
        maxLength={maxLength}
        placeholder={placeholder}
        style={{ marginTop: 6 }}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            add(text);
          }
        }}
      />
      <div className="admin-chips" style={{ marginTop: 8 }}>
        {values.map((value) => (
          <span key={value} className="admin-chip">
            {value}
            <button
              type="button"
              className="admin-chip-remove"
              aria-label={`Remove ${value}`}
              onClick={() => onValues(values.filter((item) => item !== value))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <span className="admin-note">
        {values.length}/{max} · each up to {maxLength} characters
      </span>
    </div>
  );
}

export type JobEditorProps = {
  initial: JobInput;
  brands: Brand[];
  departments: Department[];
  sources: { id: string; title: string }[];
  options: EditorOption[];
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
  options,
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
    if (intent === "publish") {
      const selected = draft.optionIds
        .map((id) => options.find((option) => option.id === id)?.group)
        .filter((group): group is OptionGroup => !!group);
      const missing = missingPublishGroups(selected);
      if (missing.length) {
        setMessage(
          `Publishing needs at least one ${missing.map((group) => optionGroupLabels[group].toLowerCase()).join(" and ")} selection.`,
        );
        return;
      }
    }
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
  const selectedGroups = draft.optionIds
    .map((id) => options.find((option) => option.id === id)?.group)
    .filter((group): group is OptionGroup => !!group);
  const missingGroups = missingPublishGroups(selectedGroups);

  return (
    <section>
      <AdminToolbar
        eyebrow={draft.id ? `Jobs / ${initial.title || "Untitled"}` : "Jobs"}
        title={draft.id ? "Edit job" : "Create job"}
      />
      <p role="status" aria-live="polite" className="admin-error">{message}</p>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save("save");
        }}
      >
        <fieldset disabled={pending} className="admin-fieldset">
          <div className="admin-actions">
            <JobStatusBadge status={status} />
            {missingGroups.length > 0 && (
              <span className="admin-chip admin-chip-warn">
                Select at least one {missingGroups.map((group) => optionGroupLabels[group].toLowerCase()).join(" and ")} to publish
              </span>
            )}
            <span className="admin-spacer" />
            {draft.id && (
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => void command("duplicate")}>
                Duplicate job
              </button>
            )}
            <button type="submit" className="admin-btn">
              {draft.id ? "Save changes" : "Save draft"}
            </button>
            {status !== "open" && (
              <button type="button" className="admin-btn" onClick={() => void save("publish")}>
                Publish job
              </button>
            )}
            {status === "open" && (
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => void command("close")}>
                Close job
              </button>
            )}
            {status === "closed" && (
              <button type="button" className="admin-btn" onClick={() => void command("reopen")}>
                Reopen job
              </button>
            )}
            {draft.id && !published && !hasApplications && (
              <button type="button" className="admin-btn admin-btn-danger" onClick={() => void command("delete")}>
                Delete draft
              </button>
            )}
          </div>

          <div className="admin-grid admin-grid-editor">
            <div className="admin-stack">
              <section aria-labelledby="job-basics" className="admin-card">
                <h2 id="job-basics" className="admin-kicker">1 · Basics</h2>
                <div className="admin-grid admin-grid-2" style={{ marginTop: 12 }}>
                  <label>
                    Title
                    <input
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
                    <span className="admin-note">
                      {published ? "🔒 Locked after first publication." : "Editable until first publication."}
                    </span>
                  </label>
                  <label>
                    Department
                    <select aria-label="Department" value={draft.departmentId} onChange={(event) => field("departmentId", event.target.value)}>
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
                    <select aria-label="Primary brand" value={draft.primaryBrandId} onChange={(event) => field("primaryBrandId", event.target.value)}>
                      {brands
                        .filter((brand) => draft.brandIds.includes(brand.id))
                        .map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>

                <fieldset>
                  <legend className="admin-kicker">Brands (select one or more)</legend>
                  <div className="admin-chips" style={{ marginTop: 8 }}>
                    {brands.map((brand) => (
                      <label key={brand.id} className="admin-chip-check">
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
                  {(() => {
                    const selected = brands.filter((brand) => draft.brandIds.includes(brand.id));
                    if (!selected.length) return null;
                    const missing = selected.filter((brand) => !brand.description?.trim());
                    if (!missing.length) return null;
                    return (
                      <p className="admin-note" style={{ marginTop: 8 }}>
                        Note: {missing.map((brand) => brand.name).join(", ")} {missing.length === 1 ? "has" : "have"} no description yet. Candidates will see only a logo and website link.
                      </p>
                    );
                  })()}
                </fieldset>

                {optionGroups.map((group) => {
                  const visible = options.filter(
                    (option) =>
                      option.group === group &&
                      (option.isActive || draft.optionIds.includes(option.id)),
                  );
                  return (
                    <fieldset key={group}>
                      <legend className="admin-kicker">
                        {optionGroupLabels[group]}
                        {group === "experience" ? " (optional)" : " (select at least one to publish)"}
                      </legend>
                      <div className="admin-chips" style={{ marginTop: 8 }}>
                        {visible.map((option) => (
                          <label key={option.id} className="admin-chip-check">
                            <input
                              type="checkbox"
                              checked={draft.optionIds.includes(option.id)}
                              onChange={(event) =>
                                setDraft({
                                  ...draft,
                                  optionIds: event.target.checked
                                    ? [...draft.optionIds, option.id]
                                    : draft.optionIds.filter((id) => id !== option.id),
                                })
                              }
                            />
                            {optionLabel(option)}
                            {option.isActive ? "" : " (inactive)"}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  );
                })}

                <label>
                  Engagement note (optional, short)
                  <input
                    value={draft.engagementNote ?? ""}
                    maxLength={80}
                    placeholder="e.g. 6 months or one campaign"
                    onChange={(event) =>
                      field("engagementNote", event.target.value ? event.target.value : null)
                    }
                  />
                  <span className="admin-note">
                    Shown next to Project-based and Duration-based selections.
                  </span>
                </label>

                <fieldset>
                  <legend className="admin-kicker">Salary</legend>
                  <div className="admin-chips" style={{ marginTop: 8 }}>
                    {([
                      ["negotiable", "Negotiable"],
                      ["range", "Show a range"],
                    ] as const).map(([mode, label]) => (
                      <label key={mode} className="admin-chip-check">
                        <input
                          type="radio"
                          name="salaryMode"
                          checked={draft.salaryMode === mode}
                          onChange={() => field("salaryMode", mode)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  {draft.salaryMode === "range" ? (
                    <label style={{ marginTop: 10 }}>
                      Salary range
                      <input
                        aria-label="Salary range"
                        value={draft.salaryText ?? ""}
                        maxLength={80}
                        placeholder="e.g. ৳ 20,000 – 30,000 per month"
                        onChange={(event) => field("salaryText", event.target.value)}
                      />
                      <span className="admin-note">Shown on the job card and at the top of the job page.</span>
                    </label>
                  ) : null}
                </fieldset>

                <div className="admin-grid admin-grid-3" style={{ marginTop: 12 }}>
                  <label>
                    Vacancies (optional)
                    <input
                      aria-label="Vacancies"
                      type="number"
                      min={1}
                      max={10000}
                      value={draft.vacancies ?? ""}
                      onChange={(event) =>
                        field("vacancies", event.target.value === "" ? null : Number(event.target.value))
                      }
                    />
                  </label>
                  <label>
                    Experience text (optional)
                    <input
                      value={draft.experienceText ?? ""}
                      maxLength={60}
                      placeholder="e.g. 1 – 4 years"
                      onChange={(event) =>
                        field("experienceText", event.target.value ? event.target.value : null)
                      }
                    />
                  </label>
                  <label>
                    Location
                    <input
                      value={draft.locationText}
                      maxLength={300}
                      onChange={(event) => field("locationText", event.target.value)}
                    />
                  </label>
                </div>
                <div className="admin-grid admin-grid-2" style={{ marginTop: 12 }}>
                  <label>
                    Deadline (your local time)
                    <input
                      aria-label="Deadline"
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
                  <label className="admin-inline" style={{ alignSelf: "end" }}>
                    <input
                      type="checkbox"
                      checked={draft.cvRequired}
                      onChange={(event) => field("cvRequired", event.target.checked)}
                    />
                    CV required
                  </label>
                </div>
              </section>

              <section aria-labelledby="job-content" className="admin-card">
                <h2 id="job-content" className="admin-kicker">2 · Content</h2>
                <label style={{ marginTop: 12 }}>
                  Summary
                  <textarea
                    aria-label="Summary"
                    value={draft.summary}
                    maxLength={200}
                    onChange={(event) => field("summary", event.target.value)}
                  />
                  <span className="admin-note" style={{ textAlign: "right" }}>{draft.summary.length}/200</span>
                </label>
                {(
                  [
                    ["descriptionMd", "Description"],
                    ["responsibilitiesMd", "Responsibilities"],
                    ["requirementsMd", "Requirements"],
                  ] as const
                ).map(([name, label]) => (
                  <div key={name} className="admin-grid admin-grid-2" style={{ marginTop: 12 }}>
                    <label>
                      {label} (Markdown)
                      <textarea
                        aria-label={`${label} (Markdown)`}
                        rows={6}
                        value={draft[name]}
                        maxLength={50000}
                        onChange={(event) => field(name, event.target.value)}
                      />
                    </label>
                    <section aria-label={`${label} preview`} className="admin-card admin-markdown">
                      <h3 className="admin-kicker">{label} preview</h3>
                      <SafeMarkdown text={draft[name]} />
                    </section>
                  </div>
                ))}
                <div className="admin-grid admin-grid-2" style={{ marginTop: 12 }}>
                  <label>
                    Nice to have (Markdown, optional)
                    <textarea
                      aria-label="Nice to have (Markdown)"
                      rows={4}
                      value={draft.niceToHaveMd}
                      maxLength={50000}
                      onChange={(event) => field("niceToHaveMd", event.target.value)}
                    />
                  </label>
                  <section aria-label="Nice to have preview" className="admin-card admin-markdown">
                    <h3 className="admin-kicker">Nice to have preview</h3>
                    <SafeMarkdown text={draft.niceToHaveMd} />
                  </section>
                </div>
                <div className="admin-grid admin-grid-2" style={{ marginTop: 12 }}>
                  <ChipInput
                    label="Skills"
                    values={draft.skills}
                    max={20}
                    maxLength={40}
                    placeholder="Add a skill and press Enter"
                    onValues={(skills) => field("skills", skills)}
                  />
                  <ChipInput
                    label="Benefits"
                    values={draft.benefits}
                    max={12}
                    maxLength={60}
                    placeholder="Add a benefit and press Enter"
                    onValues={(benefits) => field("benefits", benefits)}
                  />
                </div>
              </section>
            </div>

            <div className="admin-stack">
              <QuestionBuilder
                questions={draft.questions}
                onChange={(questions) => field("questions", questions)}
                sources={sources.filter((source) => source.id !== draft.id)}
                hasApplications={hasApplications}
              />
              {archivedLabels.length > 0 && (
                <section className="admin-card">
                  <details>
                    <summary>Archived questions ({archivedLabels.length})</summary>
                    <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                      {archivedLabels.map((label, index) => (
                        <li key={index}>{label}</li>
                      ))}
                    </ul>
                  </details>
                </section>
              )}
              <CandidatePreview questions={draft.questions} cvRequired={draft.cvRequired} />
            </div>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
