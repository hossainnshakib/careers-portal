"use client";

import { useRef, useState } from "react";
import { previewJobImportAction, importJobAction } from "@/app/admin/(protected)/jobs/import/actions";
import { maxImportBytes, type ImportPreviewRow } from "@/lib/jobs/import";

export function JobImporter() {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ImportPreviewRow[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [results, setResults] = useState<Record<number, string>>({});
  const fileVersion = useRef(0);
  async function choose(file?: File) {
    const version = ++fileVersion.current;
    setText(""); setPreview([]); setResults({}); setConfirmed(false); setError("");
    if (!file) return;
    if (file.size > maxImportBytes) { setError("JSON file must be no larger than 750 KB."); return; }
    try {
      const content = await file.text();
      if (version === fileVersion.current) setText(content);
    } catch { setError("Unable to read this file."); }
  }
  async function validate() {
    setBusy(true); setError(""); setConfirmed(false); setResults({}); setPreview([]);
    try {
      const result = await previewJobImportAction(text);
      if (result.ok) setPreview(result.data); else setError(result.error);
    } catch { setError("Preview unavailable. Try again."); }
    finally { setBusy(false); }
  }
  async function execute() {
    if (!confirmed || !preview.length || preview.some((row) => row.outcome === "error")) return;
    setBusy(true); setError(""); setConfirmed(false);
    for (const row of preview) {
      if (row.outcome === "skip") { setResults((old) => ({ ...old, [row.index]: "Skipped; no changes." })); continue; }
      try {
        const result = await importJobAction({ text, index: row.index, confirmed: true });
        if (!result.ok) {
          setResults((old) => ({ ...old, [row.index]: `Failed: ${result.error}` }));
          setError("Import stopped. Earlier successful jobs are retained; remaining jobs were not attempted. Preview the same file again to retry safely.");
          break;
        }
        setResults((old) => ({ ...old, [row.index]: result.data.outcome === "skipped"
          ? "Skipped; no changes." : `Created (${row.status}). ${result.data.warning ?? ""}` }));
      } catch {
        setResults((old) => ({ ...old, [row.index]: "Outcome unknown: connection interrupted." }));
        setError("Import stopped. Preview the same file again: committed jobs will be skipped safely.");
        break;
      }
    }
    setBusy(false);
  }
  return <div className="admin-card" style={{ padding: 24 }}>
    <p>Upload a version 1 JSON file (up to 20 jobs / 750 KB). Existing slugs or titles are always skipped, never overwritten.</p>
    <p><a className="admin-link" href="/imports/job-import-template.json" download>Download JSON example/template</a>{" · "}
      <a className="admin-link" href="/imports/job-04.json" download>Job 04 approved dataset</a></p>
    <p className="admin-muted">References use existing department, brand and option slugs. Standard questions are prepended only when includeStandardQuestions is true. Single choice uses dropdowns. Each job commits atomically; earlier successes remain if the batch stops. No applicants are created.</p>
    <label>JSON file <input aria-label="JSON file" type="file" accept=".json,application/json" disabled={busy} onChange={(event) => void choose(event.target.files?.[0])} /></label>
    <button type="button" className="admin-btn" disabled={busy || !text} onClick={() => void validate()}>Validate and preview</button>
    {error && <p role="alert" style={{ whiteSpace: "pre-wrap" }}>{error}</p>}
    {preview.length > 0 && <>
      <h2>Import preview</h2>
      <p>{preview.filter((row) => row.outcome === "create").length} to create; {preview.filter((row) => row.outcome === "skip").length} to skip; {preview.filter((row) => row.outcome === "error").length} errors.</p>
      <ol>{preview.map((row) => <li key={row.index} style={{ marginBottom: 16 }}>
        <strong>{row.title}</strong> — {row.status}; {row.questions} questions.<br />
        <code>{row.slug}</code>: {row.message}
        <p role="status">{results[row.index] ?? "Not imported."}</p>
      </li>)}</ol>
      <details><summary>Review all supplied fields and question options</summary>
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{text}</pre>
      </details>
      <label style={{ display: "block", margin: "16px 0" }}>
        <input type="checkbox" checked={confirmed} disabled={busy || preview.some((row) => row.outcome === "error")} onChange={(event) => setConfirmed(event.target.checked)} />{" "}
        I reviewed this file and confirm creating the new jobs, including publication of jobs marked published.
      </label>
      <button className="admin-btn" type="button" disabled={busy || !confirmed} onClick={() => void execute()}>{busy ? "Working…" : "Confirm import"}</button>
    </>}
    <p><a className="admin-link" href="/admin/jobs">Back to jobs</a></p>
  </div>;
}
