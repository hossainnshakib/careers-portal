"use client";

import { useEffect, useRef, useState } from "react";
import type { Brand, Department } from "@/db/schema";
import { jobInput, missingPublishGroups, type JobInput } from "@/lib/validation/jobs";
import {
  optionGroupLabels,
  optionGroups,
  optionLabel,
  type OptionGroup,
} from "@/lib/careers/option-labels";
import { slugify } from "@/lib/slug";
import { MarkdownEditor } from "./markdown-editor";
import { jobCommandAction, saveJobAction } from "@/app/admin/(protected)/jobs/actions";
import { QuestionBuilder } from "./question-builder";
import { CandidatePreview } from "./candidate-preview";
import { AdminToolbar } from "./admin-toolbar";
import { JobStatusBadge } from "./status-badge";
import { publishBlockers } from "@/lib/admin/job-publish";
import { editLocalDeadline } from "@/lib/admin/deadline";

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
    <div className="admin-content-list" data-list-kind={label}>
      <span className="admin-content-list-label">{label === "Benefits" ? "Benefits (short list)" : label}</span>
      <input
        aria-label={label}
        value={text}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-describedby={`${label.toLowerCase()}-limits`}
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
      <span id={`${label.toLowerCase()}-limits`} className="sr-only">
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
  const [copyingQuestions, setCopyingQuestions] = useState(false);
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const publication = useRef<HTMLDialogElement>(null);
  useEffect(() => setMounted(true), []);
  function field<K extends keyof JobInput>(name: K, value: JobInput[K]) {
    setDraft((current) => ({ ...current, [name]: value }));
  }
  async function save(intent: "save" | "publish") {
    if (copyingQuestions) return;
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
    if (copyingQuestions) return;
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
  const blockers = publishBlockers(draft, options);

  return (
    <section className="admin-job-editor">
      <AdminToolbar
        eyebrow={draft.id ? `Jobs / ${initial.title || "Untitled"}` : "Jobs"}
        title={draft.id ? "Edit job" : "New job"}
      />
      <p role="status" aria-live="polite" className="admin-error">{message}</p>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save("save");
        }}
      >
        <fieldset disabled={pending || copyingQuestions} className="admin-fieldset">
          <div className="admin-actions">
            <JobStatusBadge status={status} />
            <span className="admin-spacer" />
            {draft.id && (
              <button type="button" className="admin-btn admin-btn-secondary admin-editor-duplicate" aria-label="Duplicate job" onClick={() => void command("duplicate")}>
                Duplicate
              </button>
            )}
            <button type="submit" className="admin-btn admin-btn-secondary">
              {status === "draft" ? "Save draft" : "Save changes"}
            </button>
            {status !== "open" && (
              <button type="button" className="admin-btn" aria-label="Publish job" onClick={() => { setMessage(""); publication.current?.showModal(); }}>
                Publish
              </button>
            )}
            {draft.id && <details className="admin-editor-more">
              <summary className="admin-btn admin-btn-secondary" aria-label="More job actions" title="More job actions">⋯</summary>
              <div className="admin-editor-more-panel">
                <button type="button" className="admin-btn admin-btn-secondary admin-editor-mobile-duplicate" aria-label="Duplicate job" onClick={() => void command("duplicate")}>Duplicate</button>
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
            </details>}
          </div>

          <div className="admin-grid admin-grid-editor">
            <div className="admin-stack">
              <section aria-labelledby="job-basics" className="admin-card admin-job-basics">
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
                    <span>Slug{published && <span className="admin-slug-lock" aria-hidden="true"> 🔒</span>}</span>
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
                  <legend>Brands</legend>
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
                </fieldset>

                {optionGroups.map((group) => {
                  const visible = options.filter(
                    (option) =>
                      option.group === group &&
                      (option.isActive || draft.optionIds.includes(option.id)),
                  );
                  return (
                    <fieldset key={group}>
                      <legend>
                        {optionGroupLabels[group]}
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

                <fieldset className="admin-salary-mode">
                  <legend>Salary</legend>
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
                    <label style={{ marginTop: 8 }}>
                      <span className="sr-only">Salary range</span>
                      <input
                        aria-label="Salary range"
                        value={draft.salaryText ?? ""}
                        maxLength={80}
                        placeholder="৳ 30,000 – 50,000 / month"
                        onChange={(event) => field("salaryText", event.target.value)}
                      />
                      <span className="admin-note">One line, up to 80 characters, for example ৳ 30,000 – 50,000 / month</span>
                    </label>
                  ) : null}
                </fieldset>

                <div className="admin-grid admin-grid-3" style={{ marginTop: 12 }}>
                  <label>
                    Vacancies
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
                    Location
                    <input
                      value={draft.locationText}
                      maxLength={300}
                      onChange={(event) => field("locationText", event.target.value)}
                    />
                  </label>
                  <label>
                    Deadline
                    <input
                      aria-label="Deadline"
                      type="date"
                      value={mounted ? localDateTime(draft.deadlineAt).split("T")[0] : ""}
                      onChange={(event) => field("deadlineAt", editLocalDeadline(draft.deadlineAt, event.target.value))}
                    />
                  </label>
                </div>
                  <label className="admin-inline admin-cv-required">
                    <input
                      type="checkbox"
                      checked={draft.cvRequired}
                      onChange={(event) => field("cvRequired", event.target.checked)}
                    />
                    CV required
                  </label>
                {missingGroups.length > 0 && <span className="admin-chip admin-chip-warn" style={{ marginTop: 12 }}>Select at least one {missingGroups.map((group) => optionGroupLabels[group].toLowerCase()).join(" and ")} to publish</span>}
                <details className="admin-basics-extra">
                  <summary>Additional settings</summary>
                  <div className="admin-stack">
                    <p className="admin-note">{published ? "Slug locked after first publication." : "Slug editable until first publication; typing a slug stops automatic updates."}</p>
                    <label>Experience text<input aria-label="Experience text" value={draft.experienceText ?? ""} maxLength={60} placeholder="e.g. 1 – 4 years" onChange={(event) => field("experienceText", event.target.value || null)} /></label>
                    <label>Engagement note<input aria-label="Engagement note" value={draft.engagementNote ?? ""} maxLength={80} placeholder="e.g. 6 months or one campaign" onChange={(event) => field("engagementNote", event.target.value || null)} /><span className="admin-note">Shown next to Project-based and Duration-based selections.</span></label>
                    <label>Deadline time<input aria-label="Deadline time" type="time" disabled={!draft.deadlineAt} value={mounted ? localDateTime(draft.deadlineAt).split("T")[1] ?? "" : ""} onChange={(event) => field("deadlineAt", editLocalDeadline(draft.deadlineAt, localDateTime(draft.deadlineAt).split("T")[0], event.target.value))} /><span className="admin-note">Your local time. A new date defaults to 00:00; changing a date preserves the cutoff time.</span></label>
                    {(() => {
                      const missing = brands.filter((brand) => draft.brandIds.includes(brand.id) && !brand.description?.trim());
                      return missing.length ? <p className="admin-note">Note: {missing.map((brand) => brand.name).join(", ")} {missing.length === 1 ? "has" : "have"} no description yet. Candidates will see only a logo and website link.</p> : null;
                    })()}
                  </div>
                </details>
              </section>

              <section aria-labelledby="job-content" className="admin-card admin-job-content">
                <h2 id="job-content" className="admin-kicker">2 · Content</h2>
                <label>
                  Summary ({draft.summary.length}/200)
                  <textarea
                    aria-label="Summary"
                    value={draft.summary}
                    maxLength={200}
                    rows={2}
                    onChange={(event) => field("summary", event.target.value)}
                  />
                </label>
                {(
                  [
                    ["descriptionMd", "Description"],
                    ["responsibilitiesMd", "Responsibilities"],
                    ["requirementsMd", "Requirements"],
                    ["niceToHaveMd", "Nice to have"],
                  ] as const
                ).map(([name, label]) => (
                  <MarkdownEditor key={name} label={label} value={draft[name]} onChange={(value) => field(name, value)} description={name === "descriptionMd"} />
                ))}
                <div className="admin-stack admin-content-lists">
                  <ChipInput label="Benefits" values={draft.benefits} max={12} maxLength={60} placeholder="Add a benefit, press Enter" onValues={(benefits) => field("benefits", benefits)} />
                  <ChipInput
                    label="Skills"
                    values={draft.skills}
                    max={20}
                    maxLength={40}
                    placeholder="Add a skill, press Enter"
                    onValues={(skills) => field("skills", skills)}
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
                onCopyingChange={setCopyingQuestions}
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
              <CandidatePreview questions={draft.questions} cvRequired={draft.cvRequired} title={draft.title} />
            </div>
          </div>
        </fieldset>
      </form>
      <dialog ref={publication} className="admin-publish-dialog" aria-label="Confirm job publication" onCancel={(event) => { if (pending) event.preventDefault(); }}>
        <div className="admin-kicker">Publish</div>
        <h2>Publish {draft.title || "this job"}?</h2>
        <p className="admin-muted">It becomes public at <span className="admin-publish-path">/jobs/{draft.slug || "your-slug"}</span>. The slug locks after publishing.</p>
        {blockers.length ? <ul className="admin-publish-blockers">{blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul> : <span className="admin-chip admin-publish-ready">Requirements met</span>}
        {message && <p role="status" className="admin-error">{message}</p>}
        <div className="admin-publish-actions">
          <button type="button" disabled={pending} className="admin-btn admin-btn-secondary" onClick={() => publication.current?.close()}>Cancel</button>
          <button type="button" disabled={pending || blockers.length > 0} className="admin-btn" onClick={() => void save("publish")}>{pending ? "Publishing…" : "Publish"}</button>
        </div>
      </dialog>
    </section>
  );
}
