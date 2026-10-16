"use client";

import { useState } from "react";
import type { QuestionDefinition } from "@/lib/questions/definition";
import { nextOptionValue } from "@/lib/questions/editor";

export function QuestionOptions({ question, prefix, onChange }: { question: QuestionDefinition; prefix: string; onChange: (question: QuestionDefinition) => void }) {
  const [text, setText] = useState("");
  const options = question.options ?? [];
  const duplicate = new Set(options.map((option) => option.value.trim())).size !== options.length;
  return <div className="admin-question-options">
    <label>Options<input aria-label="Add option" placeholder="Add option, press Enter" maxLength={200} disabled={options.length >= 100} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      if (!text.trim() || options.length >= 100) return;
      onChange({ ...question, options: [...options, { label: text.trim(), value: nextOptionValue(options) }] });
      setText("");
    }} /></label>
    {options.map((option, index) => <div key={index} className="admin-option-row">
      <input aria-label={`${prefix} option ${index + 1} label`} maxLength={200} value={option.label} onChange={(event) => onChange({ ...question, options: options.map((item, i) => i === index ? { ...item, label: event.target.value } : item) })} />
      <input aria-label={`${prefix} option ${index + 1} value`} maxLength={200} value={option.value} onChange={(event) => onChange({ ...question, options: options.map((item, i) => i === index ? { ...item, value: event.target.value } : item) })} />
      <button type="button" className="admin-btn admin-btn-secondary" aria-label={`${prefix} remove option ${index + 1}`} onClick={() => onChange({ ...question, options: options.filter((_, i) => i !== index) })}>×</button>
    </div>)}
    {duplicate && <p role="status" className="admin-error">Option values must be unique.</p>}
  </div>;
}
