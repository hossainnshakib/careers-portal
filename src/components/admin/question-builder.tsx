"use client";

import { useRef, useState } from "react";
import { questionDefinitionSchema, type QuestionDefinition } from "@/lib/questions/definition";
import { questionSectionEnum, questionTypeEnum } from "@/db/schema";
import { copyJobQuestionsAction } from "@/app/admin/(protected)/jobs/actions";
import { copyStandardQuestions } from "@/lib/questions/defaults";
import { newQuestion, questionTypeChoices, reorderQuestions } from "@/lib/questions/editor";
import { QuestionOptions } from "./question-options";

export function QuestionBuilder({
  questions,
  onChange,
  sources,
  hasApplications,
  onCopyingChange,
}: {
  questions: QuestionDefinition[];
  onChange: (questions: QuestionDefinition[]) => void;
  sources: { id: string; title: string }[];
  hasApplications: boolean;
  onCopyingChange?: (copying: boolean) => void;
}) {
  const [source, setSource] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const [adding, setAdding] = useState<QuestionDefinition | null>(null);
  const [addError, setAddError] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  function replace(index: number, next: QuestionDefinition) {
    onChange(questions.map((q, i) => (i === index ? next : q)));
  }
  function move(index: number, direction: number) {
    if (pending) return;
    const next = reorderQuestions(questions, index, index + direction);
    if (next === questions) return;
    onChange(next);
    setMessage(`Moved ${questions[index].label || "question"} to position ${index + direction + 1}.`);
  }
  return (
    <section aria-label="Question builder" className="admin-card admin-question-builder">
      <h2 className="admin-kicker">3 · Questions</h2>
      <p className="sr-only">
        Questions removed from a job with applications are archived when saved.
      </p>
      <div className="admin-question-tools">
        <button
          type="button"
          className="admin-btn"
          disabled={pending || questions.length >= 100}
          onClick={() => { setAdding(newQuestion(questions.length)); setAddError(""); dialog.current?.showModal(); }}
        >
          Add question
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          disabled={pending || questions.length > 93}
          onClick={() => onChange([...questions, ...copyStandardQuestions(questions.length)])}
        >
          Add standard questions
        </button>
        <details className="admin-question-copy"><summary className="admin-btn admin-btn-secondary">Copy from another job</summary>
        <label>
          Copy questions from
          <select aria-label="Copy questions from" disabled={pending} value={source} onChange={(event) => setSource(event.target.value)}>
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
          disabled={!source || pending || questions.length >= 100}
          onClick={async () => {
            setPending(true);
            onCopyingChange?.(true);
            setMessage("");
            try {
              const result = await copyJobQuestionsAction({ sourceJobId: source });
              if (!result.ok) setMessage(result.error);
              else if (questions.length + result.data.length > 100)
                setMessage("A job can have at most 100 questions.");
              else {
                onChange(
                  [...questions, ...result.data].map((q, sortOrder) => ({ ...q, sortOrder })),
                );
                setMessage(`Copied ${result.data.length} questions.`);
              }
            } catch {
              setMessage("Unable to copy questions. Try again.");
            } finally {
              setPending(false);
              onCopyingChange?.(false);
            }
          }}
        >
          Copy questions
        </button>
        </details>
      </div>
      <p role="status" aria-live="polite" className="admin-question-feedback">
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
          disabled={pending}
          onDragStart={(event) => { setDragging(q.id); event.dataTransfer.setData("text/plain", q.id); event.dataTransfer.effectAllowed = "move"; }}
          onDragEnd={() => setDragging(null)}
          onDragOver={(event) => { if (dragging && !pending) event.preventDefault(); }}
          onDrop={(event) => {
            event.preventDefault();
            if (pending || !dragging || event.dataTransfer.getData("text/plain") !== dragging) return;
            const from = questions.findIndex((question) => question.id === dragging);
            onChange(reorderQuestions(questions, from, index));
            setMessage(`Moved question to position ${index + 1}.`); setDragging(null);
          }}
        />
      ))}
      {!questions.length && <p className="admin-question-empty admin-muted">No questions yet.</p>}
      <dialog ref={dialog} aria-label="Add question" className="admin-add-question-dialog" onKeyDown={(event) => { if (event.key === "Enter" && event.target instanceof HTMLInputElement) event.preventDefault(); }} onClose={() => { if (!dialog.current?.open) { setAdding(null); setAddError(""); } }}>
        <div className="admin-kicker">Add question</div><h2>New question</h2>
        {adding && <QuestionCard question={adding} index={questions.length} onChange={setAdding} onRemove={() => {}} onMove={() => {}} count={questions.length + 1} hasApplications={false} dialogMode />}
        {addError && <p role="status" className="admin-error">{addError}</p>}
        <div className="admin-publish-actions">
          <button type="button" className="admin-btn admin-btn-secondary" onClick={() => dialog.current?.close()}>Cancel</button>
          <button type="button" className="admin-btn" onClick={() => {
            if (!adding) return;
            const result = questionDefinitionSchema.safeParse({ ...adding, sortOrder: questions.length });
            if (!result.success) { setAddError(result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")); return; }
            if (questions.length >= 100) { setAddError("A job can have at most 100 questions."); return; }
            onChange([...questions, result.data]); dialog.current?.close();
          }}>Add question</button>
        </div>
      </dialog>
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
  dialogMode = false, disabled = false, onDragStart, onDragEnd, onDragOver, onDrop,
}: {
  question: QuestionDefinition;
  index: number;
  onChange: (q: QuestionDefinition) => void;
  onRemove: () => void;
  onMove: (index: number, direction: number) => void;
  count: number;
  hasApplications: boolean;
  dialogMode?: boolean; disabled?: boolean;
  onDragStart?: React.DragEventHandler; onDragEnd?: React.DragEventHandler;
  onDragOver?: React.DragEventHandler; onDrop?: React.DragEventHandler;
}) {
  const [editing, setEditing] = useState(false);
  const prefix = dialogMode ? "New question" : `Question ${index + 1}`;
  const config = q.config ?? {};
  function configure(key: string, value: unknown) {
    const next = { ...config };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onChange({ ...q, config: next });
  }
  function numeric(key: string, label: string) {
    return (
      <label key={key} className="admin-numeric-question">
        {label}
        <input
          aria-label={`${prefix} ${label}`}
          type="number"
          placeholder={label.startsWith("Minimum") ? "Min length / value" : "Max length / value"}
          value={typeof config[key] === "number" ? config[key] : ""}
          onChange={(event) =>
            configure(key, event.target.value === "" ? undefined : Number(event.target.value))
          }
        />
      </label>
    );
  }
  return (
    <fieldset disabled={disabled} className={dialogMode ? "admin-question-dialog-fields" : "admin-question"} onDragOver={onDragOver} onDrop={onDrop}>
      <legend className="sr-only">{prefix}</legend>
      {!dialogMode && <div className="admin-question-head">
        <button type="button" className="admin-question-gutter" draggable={!disabled} onDragStart={onDragStart} onDragEnd={onDragEnd} aria-label={`Move question ${index + 1}`} title="Drag to reorder, or use arrow keys" onKeyDown={(event) => { if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); onMove(index, event.key === "ArrowUp" ? -1 : 1); } }}>⋮⋮</button>
        <button type="button" className="admin-question-edit" aria-label={`Edit question ${index + 1}`} aria-expanded={editing} onClick={() => setEditing(!editing)}>{q.label || "Untitled question"}</button>
        <span className="admin-question-type">{questionTypeChoices.find(([type]) => type === q.type)?.[1]}</span>
        <label className="admin-inline"><input aria-label={`${prefix} required`} type="checkbox" checked={q.required} onChange={(event) => onChange({ ...q, required: event.target.checked })} />Required</label>
        <button type="button" className="admin-btn admin-btn-secondary" aria-label={`${hasApplications ? "Archive" : "Remove"} ${prefix}`} onClick={onRemove}>{hasApplications ? "Archive" : "Remove"}</button>
      </div>}
      <div className="admin-question-edit-fields" hidden={!dialogMode && !editing}>
        {dialogMode && <label>Type<select aria-label={`${prefix} type`} value={q.type} onChange={(event) => onChange({ ...q, type: event.target.value as QuestionDefinition["type"], options: event.target.value.endsWith("choice") ? [] : null, config: null })}>{questionTypeChoices.map(([type, label]) => <option key={type} value={type}>{label}</option>)}</select></label>}
        <label>Label
        <input
          aria-label={`${prefix} label`}
          value={q.label}
          maxLength={300}
          onChange={(event) => onChange({ ...q, label: event.target.value })}
        />
        </label>
        {!dialogMode && <label>Type<select
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
            onChange({ ...q, type, config: null, options });
          }}
        >
          {questionTypeEnum.enumValues.map((value) => (
            <option key={value} value={value}>
              {value.replaceAll("_", " ")}
            </option>
          ))}
        </select></label>}
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-icon-btn"
          disabled={dialogMode || index === 0}
          onClick={() => onMove(index, -1)}
          aria-label={`${prefix} move up`}
        >
          ↑
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-icon-btn"
          disabled={dialogMode || index === count - 1}
          onClick={() => onMove(index, 1)}
          aria-label={`${prefix} move down`}
        >
          ↓
        </button>
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
        {dialogMode && <label className="admin-inline"><input aria-label={`${prefix} required`} type="checkbox" checked={q.required} onChange={(event) => onChange({ ...q, required: event.target.checked })} />Required</label>}
        <details className="admin-question-section"><summary>Additional settings</summary><label>
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
        </label></details>
        {q.type.endsWith("choice") && (
          <>
            <QuestionOptions question={q} prefix={prefix} onChange={onChange} />
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
          <div role="group" aria-label={`${prefix} display`} className="admin-write-preview">{(["dropdown", "radio"] as const).map((display) => <button key={display} type="button" aria-pressed={(config.display ?? "radio") === display} onClick={() => configure("display", display)}>{display === "radio" ? "Radio" : "Dropdown"}</button>)}</div>
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
      </div>
    </fieldset>
  );
}
