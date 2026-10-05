"use client";

import { useState } from "react";
import { questionSectionEnum, questionTypeEnum } from "@/db/schema";
import type { QuestionDefinition } from "@/lib/questions/definition";
import { copyJobQuestionsAction } from "@/app/admin/(protected)/jobs/actions";

const inputClass = "mt-1 block w-full rounded border border-input bg-card p-2";
const buttonClass = "rounded border border-border px-3 py-2 disabled:opacity-50";
export function QuestionBuilder({
  questions,
  onChange,
  hasApplications,
  sources,
}: {
  questions: QuestionDefinition[];
  onChange: (questions: QuestionDefinition[]) => void;
  hasApplications: boolean;
  sources: { id: string; title: string }[];
}) {
  const [source, setSource] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  function replace(index: number, q: QuestionDefinition) {
    onChange(questions.map((item, i) => (i === index ? q : item)));
  }
  function move(index: number, direction: number) {
    const next = [...questions];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next.map((q, sortOrder) => ({ ...q, sortOrder })));
  }
  return (
    <section
      aria-label="Question builder"
      className="space-y-4 rounded border border-border bg-card p-5"
    >
      <h2 className="text-xl font-semibold">3. Questions</h2>
      <p>Questions removed from a job with applications are archived when saved.</p>
      <div className="flex flex-wrap items-end gap-3">
        <button
          type="button"
          className={buttonClass}
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
        <label>
          Copy questions from
          <select
            aria-label="Copy questions from"
            className={inputClass}
            value={source}
            onChange={(event) => setSource(event.target.value)}
          >
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
          className={buttonClass}
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
      <p role="status">{message}</p>
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
          className={inputClass}
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
    <fieldset className="space-y-3 rounded border border-border p-4">
      <legend className="font-semibold">{prefix}</legend>
      <div className="grid gap-3 md:grid-cols-2">
        <label>
          Label
          <input
            aria-label={`${prefix} label`}
            className={inputClass}
            value={q.label}
            maxLength={300}
            onChange={(event) => onChange({ ...q, label: event.target.value })}
          />
        </label>
        <label>
          Type
          <select
            aria-label={`${prefix} type`}
            className={inputClass}
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
        </label>
        <label>
          Help text
          <input
            aria-label={`${prefix} help text`}
            className={inputClass}
            value={q.helpText ?? ""}
            maxLength={2000}
            onChange={(event) => onChange({ ...q, helpText: event.target.value || null })}
          />
        </label>
        <label>
          Section
          <select
            aria-label={`${prefix} section`}
            className={inputClass}
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
        <label className="flex gap-2">
          <input
            aria-label={`${prefix} required`}
            type="checkbox"
            checked={q.required}
            onChange={(event) => onChange({ ...q, required: event.target.checked })}
          />
          Required
        </label>
        {q.type.endsWith("choice") && (
          <>
            <label className="md:col-span-2">
              Options: one value | label per line
              <textarea
                aria-label={`${prefix} options`}
                className={inputClass}
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
            <label className="flex gap-2">
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
              className={inputClass}
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
            <label className="flex gap-2">
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
                  className={inputClass}
                  value={typeof config[key] === "string" ? config[key] : ""}
                  placeholder="YYYY-MM-DD or today"
                  onChange={(event) => configure(key, event.target.value || undefined)}
                />
              </label>
            ))}
            <p className="text-sm">Bounds are inclusive; today uses the UTC calendar date.</p>
          </>
        )}
        {q.type === "file_upload" && (
          <>
            <fieldset>
              <legend>Accepted extensions</legend>
              <div className="flex flex-wrap gap-2">
                {["pdf", "png", "jpg", "webp", "zip"].map((ext) => {
                  const accept = Array.isArray(config.accept)
                    ? (config.accept as string[])
                    : ["pdf", "png", "jpg", "webp", "zip"];
                  return (
                    <label key={ext}>
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
      <div className="flex gap-2">
        <button
          type="button"
          className={buttonClass}
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
          aria-label={`${prefix} move up`}
        >
          ↑
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={index === count - 1}
          onClick={() => onMove(index, 1)}
          aria-label={`${prefix} move down`}
        >
          ↓
        </button>
        <button type="button" className={buttonClass} onClick={onRemove}>
          {hasApplications ? "Archive" : "Remove"} {prefix}
        </button>
      </div>
    </fieldset>
  );
}
