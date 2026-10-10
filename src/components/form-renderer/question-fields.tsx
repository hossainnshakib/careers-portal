"use client";

import type { QuestionDefinition } from "@/lib/questions/definition";
import type { Answer } from "@/lib/validation/buildSchema";
import { useState } from "react";

const inputClass = "mt-1 block w-full rounded border border-input bg-card p-2";
export function QuestionFields({
  question: q,
  value,
  other,
  onChange,
  onOtherChange,
  error,
}: {
  question: QuestionDefinition;
  value: Answer;
  other: string;
  onChange: (value: Answer) => void;
  onOtherChange: (text: string) => void;
  error?: string;
}) {
  const [fileError, setFileError] = useState("");
  const config = q.config ?? {};
  const choice = q.type.endsWith("choice");
  const options = q.options ?? [];
  const selected = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const otherSelected = selected.some((value) => !options.some((option) => option.value === value));
  // Generate a UI-only sentinel that cannot collide with administrator option values.
  let otherValue = `other:${q.id}`;
  while (options.some((o) => o.value === otherValue)) otherValue += ":other";
  function choose(option: string, checked: boolean) {
    if (q.type === "single_choice") onChange(option);
    else onChange(checked ? [...selected, option] : selected.filter((v) => v !== option));
  }
  return (
    <fieldset className="question-field space-y-2" data-question-type={q.type} aria-describedby={[q.helpText ? `question-help-${q.id}` : "", error ? `question-error-${q.id}` : ""].filter(Boolean).join(" ") || undefined}>
      <legend className="question-label font-medium">
        {q.label}
        {q.required && <span className="question-required"> *</span>}
      </legend>
      {q.helpText && <p id={`question-help-${q.id}`} className="question-help text-sm text-muted-foreground">{q.helpText}</p>}
      {choice ? (
        <>
          {q.type === "single_choice" && config.display === "dropdown" ? (
            <select
              aria-label={q.label}
              aria-invalid={!!error}
              className={inputClass}
              value={otherSelected ? otherValue : ((value as string) ?? "")}
              onChange={(event) => onChange(event.target.value || undefined)}
            >
              <option value="">Choose an option</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
              {config.allowOther === true && <option value={otherValue}>Other</option>}
            </select>
          ) : (
            <div className="question-choices flex flex-wrap gap-4">
              {options.map((o) => (
                <label key={o.value} className="question-choice flex gap-2" data-selected={selected.includes(o.value)}>
                  <input
                    type={q.type === "single_choice" ? "radio" : "checkbox"}
                    name={`preview-${q.id}`}
                    aria-invalid={!!error}
                    checked={selected.includes(o.value)}
                    onChange={(event) => choose(o.value, event.target.checked)}
                  />
                  {o.label}
                </label>
              ))}
              {config.allowOther === true && (
                <label className="question-choice flex gap-2" data-selected={otherSelected}>
                  <input
                    type={q.type === "single_choice" ? "radio" : "checkbox"}
                    name={`preview-${q.id}`}
                    aria-invalid={!!error}
                    checked={otherSelected}
                    onChange={(event) => choose(otherValue, event.target.checked)}
                  />
                  Other
                </label>
              )}
            </div>
          )}
          {otherSelected && (
            <label>
              Other answer
              <input
                aria-label={`${q.label} Other answer`}
                className={inputClass}
                value={other}
                maxLength={500}
                onChange={(event) => onOtherChange(event.target.value)}
              />
            </label>
          )}
        </>
      ) : q.type === "yes_no" ? (
        <select
          aria-label={q.label}
          aria-invalid={!!error}
          className={inputClass}
          value={value === true ? "yes" : value === false ? "no" : ""}
          onChange={(event) =>
            onChange(event.target.value === "" ? undefined : event.target.value === "yes")
          }
        >
          <option value="">Choose</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      ) : q.type === "long_text" ? (
        <textarea
          aria-label={q.label}
          aria-invalid={!!error}
          className={inputClass}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : q.type === "file_upload" ? (
        <label>
          Choose preview files
          <input
            aria-label={q.label}
            className={inputClass}
            type="file"
            multiple
            accept={(Array.isArray(config.accept)
              ? config.accept
              : ["pdf", "png", "jpg", "webp", "zip"]
            )
              .map((ext) => `.${ext}`)
              .join(",")}
            onChange={(event) => {
              const files = [...(event.target.files ?? [])];
              const accept = Array.isArray(config.accept)
                ? config.accept
                : ["pdf", "png", "jpg", "webp", "zip"];
              const max =
                (typeof config.maxSizeMb === "number" ? config.maxSizeMb : 10) * 1024 * 1024;
              if (
                files.length > 8 ||
                files.some(
                  (file) =>
                    file.size > max || !accept.includes(file.name.split(".").at(-1)?.toLowerCase()),
                )
              ) {
                setFileError(
                  "Choose permitted extensions within the size limit (at most eight files).",
                );
                onChange(["invalid-file"]);
                return;
              }
              setFileError("");
              onChange(files.length ? files.map(() => crypto.randomUUID()) : undefined);
            }}
          />
          <span className="text-sm">
            Preview only; files are not uploaded. Max{" "}
            {typeof config.maxSizeMb === "number" ? config.maxSizeMb : 10} MB per file.
          </span>
        </label>
      ) : (
        <input
          aria-label={q.label}
          aria-invalid={!!error}
          className={inputClass}
          type={
            q.type === "number"
              ? "number"
              : q.type === "date"
                ? "date"
                : q.type === "email"
                  ? "email"
                  : q.type === "url"
                    ? "url"
                    : q.type === "phone"
                      ? "tel"
                      : "text"
          }
          value={typeof value === "string" || typeof value === "number" ? value : ""}
          step={q.type === "number" ? (config.integer === true ? "1" : "any") : undefined}
          onChange={(event) =>
            onChange(
              q.type === "number"
                ? event.target.value === ""
                  ? undefined
                  : Number(event.target.value)
                : event.target.value,
            )
          }
        />
      )}
      {fileError && <p role="alert">{fileError}</p>}
      {error && <p id={`question-error-${q.id}`} role="alert" className="question-error">{error}</p>}
    </fieldset>
  );
}
