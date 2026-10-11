"use client";

import { useState } from "react";
import type { QuestionDefinition } from "@/lib/questions/definition";
import { questionSectionEnum, questionTypeEnum } from "@/db/schema";
import { copyJobQuestionsAction } from "@/app/admin/(protected)/jobs/actions";
import { copyStandardQuestions } from "@/lib/questions/defaults";

export function QuestionBuilder({
  questions,
  onChange,
  sources,
  hasApplications,
}: {
  questions: QuestionDefinition[];
  onChange: (questions: QuestionDefinition[]) => void;
  sources: { id: string; title: string }[];
  hasApplications: boolean;
}) {
  const [source, setSource] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  function replace(index: number, next: QuestionDefinition) {
    onChange(questions.map((q, i) => (i === index ? next : q)));
  }
  function move(index: number, direction: number) {
    const next = [...questions];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next.map((q, sortOrder) => ({ ...q, sortOrder })));
  }
  return (
    <section aria-label="Question builder" className="admin-card">
      <h2 className="admin-kicker">3 · Questions</h2>
      <p className="admin-note">
        Questions removed from a job with applications are archived when saved.
      </p>
      <div className="admin-question-tools">
        <button
          type="button"
          className="admin-btn"
          disabled={questions.length >= 100}
          onClick={() =>
            onChange([
              ...questions,
              {
                id: crypto.randomUUID(),
                label: "",
                type: "short_text",
                required: false,
                helpText: null,
                section: "role_specific",
                options: null,
                config: null,
                sortOrder: questions.length,
              },
            ])
          }
        >
          Add question
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          disabled={questions.length > 93}
          onClick={() => onChange([...questions, ...copyStandardQuestions(questions.length)])}
        >
          Add standard questions
        </button>
        <label>
          Copy questions from
          <select aria-label="Copy questions from" value={source} onChange={(event) => setSource(event.target.value)}>
            <option value="">Choose job</option>
            {sources.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          disabled={!source || pending}
          onClick={async () => {
            setPending(true);
            setMessage("");
            try {
              const result = await copyJobQuestionsAction({ sourceJobId: source });
              if (!result.ok) setMessage(result.error);
              else if (questions.length + result.data.length > 100)
                setMessage("A job can have at most 100 questions.");
              else
                onChange(
                  [...questions, ...result.data].map((q, sortOrder) => ({ ...q, sortOrder })),
                );
            } catch {
              setMessage("Unable to copy questions. Try again.");
            } finally {
              setPending(false);
            }
          }}
        >
          Copy questions
        </button>
      </div>
      <p role="status" className="admin-error">
        {message}
      </p>
      {questions.map((q, index) => (
        <QuestionCard
          key={q.id}
          question={q}
          index={index}
          onChange={(q) => replace(index, q)}
          onRemove={() =>
            onChange(
              questions.filter((_, i) => i !== index).map((q, sortOrder) => ({ ...q, sortOrder })),
            )
          }
          onMove={move}
          count={questions.length}
          hasApplications={hasApplications}
        />
      ))}
    </section>
  );
}

function QuestionCard({
  question: q,
  index,
  onChange,
  onRemove,
  onMove,
  count,
  hasApplications,
}: {
  question: QuestionDefinition;
  index: number;
  onChange: (q: QuestionDefinition) => void;
  onRemove: () => void;
  onMove: (index: number, direction: number) => void;
  count: number;
  hasApplications: boolean;
}) {
  const [optionText, setOptionText] = useState(
    q.options?.map((o) => `${o.value} | ${o.label}`).join("\n") ?? "",
  );
  const prefix = `Question ${index + 1}`;
  const config = q.config ?? {};
  function configure(key: string, value: unknown) {
    const next = { ...config };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onChange({ ...q, config: next });
  }
  function numeric(key: string, label: string) {
    return (
      <label key={key}>
        {label}
        <input
          aria-label={`${prefix} ${label}`}
          type="number"
          value={typeof config[key] === "number" ? config[key] : ""}
          onChange={(event) =>
            configure(key, event.target.value === "" ? undefined : Number(event.target.value))
          }
        />
      </label>
    );
  }
  return (
    <fieldset className="admin-question">
      <legend className="sr-only">{prefix}</legend>
      <div className="admin-question-head">
        <span className="admin-question-gutter" aria-hidden="true">
          ⋮⋮
        </span>
        <input
          aria-label={`${prefix} label`}
          value={q.label}
          maxLength={300}
          onChange={(event) => onChange({ ...q, label: event.target.value })}
        />
        <select
          aria-label={`${prefix} type`}
          value={q.type}
          onChange={(event) => {
            const type = event.target.value as QuestionDefinition["type"];
            const options = type.endsWith("choice")
              ? [
                  { value: "option_1", label: "Option 1" },
                  { value: "option_2", label: "Option 2" },
                ]
              : null;
            setOptionText(options?.map((o) => `${o.value} | ${o.label}`).join("\n") ?? "");
            onChange({ ...q, type, config: null, options });
          }}
        >
          {questionTypeEnum.enumValues.map((value) => (
            <option key={value} value={value}>
              {value.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <label className="admin-inline">
          <input
            aria-label={`${prefix} required`}
            type="checkbox"
            checked={q.required}
            onChange={(event) => onChange({ ...q, required: event.target.checked })}
          />
          Required
        </label>
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-icon-btn"
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
          aria-label={`${prefix} move up`}
        >
          ↑
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-icon-btn"
          disabled={index === count - 1}
          onClick={() => onMove(index, 1)}
          aria-label={`${prefix} move down`}
        >
          ↓
        </button>
        <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={onRemove}>
          {hasApplications ? "Archive" : "Remove"} {prefix}
        </button>
      </div>
      <div className="admin-grid admin-grid-2">
        <label>
          Help text
          <input
            aria-label={`${prefix} help text`}
            value={q.helpText ?? ""}
            maxLength={2000}
            onChange={(event) => onChange({ ...q, helpText: event.target.value || null })}
          />
        </label>
        <label>
          Section
          <select
            aria-label={`${prefix} section`}
            value={q.section}
            onChange={(event) =>
              onChange({ ...q, section: event.target.value as QuestionDefinition["section"] })
            }
          >
            {questionSectionEnum.enumValues.map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        {q.type.endsWith("choice") && (
          <>
            <label style={{ gridColumn: "1 / -1" }}>
              Options: one value | label per line
              <textarea
                aria-label={`${prefix} options`}
                rows={4}
                value={optionText}
                onChange={(event) => {
                  const text = event.target.value;
                  setOptionText(text);
                  onChange({
                    ...q,
                    options: text
                      .split("\n")
                      .filter((line) => line.trim())
                      .map((line) => {
                        const [value, ...labels] = line.split("|");
                        return {
                          value: value.trim(),
                          label: labels.join("|").trim() || value.trim(),
                        };
                      }),
                  });
                }}
              />
            </label>
            <label className="admin-inline">
              <input
                aria-label={`${prefix} allow Other`}
                type="checkbox"
                checked={config.allowOther === true}
                onChange={(event) => configure("allowOther", event.target.checked)}
              />
              Allow Other free text
            </label>
          </>
        )}
        {q.type === "single_choice" && (
          <label>
            Display
            <select
              aria-label={`${prefix} display`}
              value={typeof config.display === "string" ? config.display : "radio"}
              onChange={(event) => configure("display", event.target.value)}
            >
              <option value="radio">Radio</option>
              <option value="dropdown">Dropdown</option>
            </select>
          </label>
        )}
        {q.type === "multiple_choice" && (
          <>
            {numeric("minSelected", "Minimum selections")}
            {numeric("maxSelected", "Maximum selections")}
          </>
        )}
        {(q.type === "short_text" || q.type === "long_text") && (
          <>
            {numeric("minLength", "Minimum length")}
            {numeric("maxLength", "Maximum length")}
          </>
        )}
        {q.type === "number" && (
          <>
            {numeric("min", "Minimum")}
            {numeric("max", "Maximum")}
            <label className="admin-inline">
              <input
                aria-label={`${prefix} integer`}
                type="checkbox"
                checked={config.integer === true}
                onChange={(event) => configure("integer", event.target.checked)}
              />
              Integer only
            </label>
          </>
        )}
        {q.type === "date" && (
          <>
            {["min", "max"].map((key) => (
              <label key={key}>
                {key === "min" ? "Earliest" : "Latest"} date
                <input
                  aria-label={`${prefix} ${key} date`}
                  value={typeof config[key] === "string" ? config[key] : ""}
                  placeholder="YYYY-MM-DD or today"
                  onChange={(event) => configure(key, event.target.value || undefined)}
                />
              </label>
            ))}
            <p className="admin-note">Bounds are inclusive; today uses the UTC calendar date.</p>
          </>
        )}
        {q.type === "file_upload" && (
          <>
            <fieldset>
              <legend className="admin-kicker is-muted">Accepted extensions</legend>
              <div className="admin-chips" style={{ marginTop: 8 }}>
                {["pdf", "png", "jpg", "webp", "zip"].map((ext) => {
                  const accept = Array.isArray(config.accept)
                    ? (config.accept as string[])
                    : ["pdf", "png", "jpg", "webp", "zip"];
                  return (
                    <label key={ext} className="admin-chip-check">
                      <input
                        aria-label={`${prefix} accept ${ext}`}
                        type="checkbox"
                        checked={accept.includes(ext)}
                        onChange={(event) =>
                          configure(
                            "accept",
                            event.target.checked
                              ? [...accept, ext]
                              : accept.filter((value) => value !== ext),
                          )
                        }
                      />
                      {ext}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            {numeric("maxSizeMb", "Maximum size MB")}
          </>
        )}
      </div>
    </fieldset>
  );
}
