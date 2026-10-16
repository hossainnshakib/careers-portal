"use client";

import { useId, useState } from "react";
import { SafeMarkdown } from "@/lib/markdown/render";

export function MarkdownEditor({ label, value, onChange, description = false }: { label: string; value: string; onChange: (value: string) => void; description?: boolean }) {
  const id = useId();
  const [preview, setPreview] = useState(false);
  const toggle = <div role="group" aria-label={`${label} mode`} className="admin-write-preview">
    <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>Write</button>
    <button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>Preview</button>
  </div>;
  return <div className={`admin-markdown-editor${description ? " is-description" : ""}`}>
    {description && toggle}
    <label htmlFor={id}>{label}</label>
    {!description && toggle}
    <textarea id={id} aria-label={`${label} (Markdown)`} rows={description ? 4 : 3} maxLength={50000} value={value} onChange={(event) => onChange(event.target.value)} hidden={preview} />
    {preview && <section aria-label={`${label} preview`} className="admin-markdown admin-markdown-editor-preview">
      {value.trim() ? <SafeMarkdown text={value} /> : <p className="admin-muted">Nothing to preview yet.</p>}
    </section>}
  </div>;
}
