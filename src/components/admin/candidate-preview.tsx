"use client";

import { useState } from "react";
import { buildSchema, type Answer } from "@/lib/validation/buildSchema";
import type { QuestionDefinition } from "@/lib/questions/definition";
import { questionSectionEnum } from "@/db/schema";
import { QuestionFields } from "@/components/form-renderer/question-fields";

const fixed = (
  [
    ["Full name", "short_text"],
    ["Email", "email"],
    ["Phone", "phone"],
    ["Location", "short_text"],
    ["CV", "file_upload"],
  ] as const
).map(([label, type], index): QuestionDefinition => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  label,
  type,
  required: true,
  options: null,
  config: null,
  helpText: null,
  section: "professional",
  sortOrder: index,
}));

export function CandidatePreview({
  questions,
  cvRequired,
}: {
  questions: QuestionDefinition[];
  cvRequired: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [other, setOther] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [personal, setPersonal] = useState<Record<string, Answer>>({});
  return (
    <section
      aria-label="Candidate form preview"
      className="space-y-4 rounded border border-border bg-card p-5"
    >
      <h2 className="text-xl font-semibold">4. Candidate form preview</h2>
      <p>Local preview only. Answers and selected files are not submitted.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {fixed.slice(0, 4).map((q) => (
          <label key={q.id}>
            {q.label} *
            <input
              aria-label={`Preview ${q.label}`}
              value={typeof personal[q.id] === "string" ? String(personal[q.id]) : ""}
              onChange={(event) => setPersonal({ ...personal, [q.id]: event.target.value })}
              className="mt-1 block w-full rounded border border-input p-2"
            />
          </label>
        ))}
        <label>
          CV {cvRequired ? "*" : "(optional)"}
          <input
            aria-label="Preview CV"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setPersonal({
                ...personal,
                [fixed[4].id]: file
                  ? file.size <= 5 * 1024 * 1024 &&
                    ["pdf", "doc", "docx"].includes(
                      file.name.split(".").at(-1)?.toLowerCase() ?? "",
                    )
                    ? [crypto.randomUUID()]
                    : ["invalid-cv"]
                  : undefined,
              });
            }}
          />
        </label>
      </div>
      {questionSectionEnum.enumValues.map((section) => (
        <section key={section} aria-label={`Preview ${section}`} className="space-y-4">
          {questions.some((q) => q.section === section) && (
            <h3 className="font-semibold capitalize">{section.replaceAll("_", " ")}</h3>
          )}
          {questions
            .filter((q) => q.section === section)
            .map((q) => (
              <QuestionFields
                key={q.id}
                question={q}
                value={answers[q.id]}
                other={other[q.id] ?? ""}
                onChange={(value) => setAnswers({ ...answers, [q.id]: value })}
                onOtherChange={(value) => setOther({ ...other, [q.id]: value })}
              />
            ))}
        </section>
      ))}
      <button
        type="button"
        className="rounded border border-border px-4 py-2"
        onClick={() => {
          try {
            const personalResult = buildSchema(
              fixed.map((q) => ({ ...q, required: q.type === "file_upload" ? cvRequired : true })),
            ).safeParse(personal);
            if (!personalResult.success) {
              setMessage(
                personalResult.error.issues
                  .map(
                    (issue) =>
                      `${fixed.find((q) => q.id === issue.path[0])?.label}: ${issue.message}`,
                  )
                  .join("; "),
              );
              return;
            }
            const data: Record<string, Answer> = {};
            for (const q of questions) {
              const values = new Set(q.options?.map((o) => o.value));
              const answer = answers[q.id];
              if (
                ((q.type === "single_choice" &&
                  typeof answer === "string" &&
                  !values.has(answer)) ||
                  (q.type === "multiple_choice" &&
                    Array.isArray(answer) &&
                    answer.some((value) => !values.has(value)))) &&
                !(other[q.id] ?? "").trim()
              ) {
                setMessage(`${q.label}: Provide a nonempty Other answer.`);
                return;
              }
              data[q.id] =
                q.type === "single_choice" && typeof answer === "string" && !values.has(answer)
                  ? (other[q.id] ?? "")
                  : q.type === "multiple_choice" && Array.isArray(answer)
                    ? answer.map((value) => (values.has(value) ? value : (other[q.id] ?? "")))
                    : answer;
            }
            const result = buildSchema(questions).safeParse(data);
            setMessage(
              result.success
                ? "Preview answers are valid."
                : result.error.issues
                    .map(
                      (issue) =>
                        `${questions.find((q) => q.id === issue.path[0])?.label ?? "Answers"}: ${issue.message}`,
                    )
                    .join("; "),
            );
          } catch {
            setMessage("Complete valid question definitions before validating the preview.");
          }
        }}
      >
        Validate preview answers
      </button>
      <p role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
