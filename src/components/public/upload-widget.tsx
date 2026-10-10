"use client";

import { useEffect, useId, useRef, useState } from "react";
import { mimeByExtension } from "@/lib/validation/uploads";
import { PublicIcon } from "./public-icon";

type UploadItem = { key: string; file: File; id?: string; progress: number; status: "uploading" | "done" | "error"; error?: string };
export type PrepareUpload = (file: File, slot: string, uploadId?: string) => Promise<{ uploadId: string; signedUrl: string; uploaded?: boolean }>;
export function UploadWidget({ label, slot, accept, maxMb, multiple = false, prepare, onChange, onBusy }: {
  label: string; slot: string; accept: string[]; maxMb: number; multiple?: boolean;
  prepare: PrepareUpload; onChange: (ids: string[]) => void; onBusy: (delta: number) => void;
}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const uploading = items.some(item => item.status === "uploading");
  const publish = (next: UploadItem[]) => { setItems(next); onChange(next.filter((i) => i.status === "done" && i.id).map((i) => i.id!)); };
  function update(key: string, patch: Partial<UploadItem>) {
    setItems((current) => current.map((item) => item.key === key ? { ...item, ...patch } : item));
  }
  async function upload(item: UploadItem) {
    onBusy(1); update(item.key, { status: "uploading", error: undefined });
    try {
      const authorized = await prepare(item.file, slot, item.id);
      item.id = authorized.uploadId;
      update(item.key, { id: item.id });
      if (!authorized.uploaded) await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest(); xhr.open("PUT", authorized.signedUrl);
        xhr.setRequestHeader("Content-Type", item.file.type || mimeByExtension[item.file.name.split(".").at(-1)?.toLowerCase() ?? ""]);
        xhr.setRequestHeader("x-upsert", "false"); xhr.timeout = 120000;
        xhr.upload.onprogress = (event) => { if (event.lengthComputable) update(item.key, { progress: Math.round(event.loaded / event.total * 100) }); };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed. Retry or choose another file."));
        xhr.onerror = xhr.ontimeout = () => reject(new Error("Upload interrupted. Check your connection and retry."));
        xhr.send(item.file);
      });
      item.status = "done"; item.progress = 100;
    } catch (error) { item.status = "error"; item.error = error instanceof Error ? error.message : "Upload failed."; }
    finally {
      setItems((current) => { const next = current.map((i) => i.key === item.key ? { ...item } : i); return next; });
      onBusy(-1);
    }
  }
  // Publish completed opaque IDs outside React's state updater (which may run twice).
  const ids = items.filter((item) => item.status === "done" && item.id).map((item) => item.id!);
  const signature = ids.join(",");
  function choose(chosen: File[]) {
    if (uploading || !chosen.length) return;
    if ((!multiple && items.length + chosen.length > 1) || items.length + chosen.length > 8) { setMessage("Remove an existing file before choosing another."); return; }
    if (chosen.some(file => !file.size || file.size > maxMb * 1024 * 1024 || !accept.includes((file.name.split(".").at(-1)?.toLowerCase() ?? "").replace(/^jpeg$/, "jpg")))) { setMessage(`Choose permitted files up to ${maxMb} MB each.`); return; }
    setMessage("");
    const additions: UploadItem[] = chosen.map(file => ({ key: crypto.randomUUID(), file, progress: 0, status: "uploading" }));
    setItems(current => [...current, ...additions]);
    for (const item of additions) void upload(item);
  }
  // This effect synchronizes the upload state with the parent form.
  return <UploadState label={label} signature={signature} onChange={onChange}>
    <label htmlFor={inputId} className="mb-[7px] block text-[13.5px] font-bold">{label.endsWith(" *") ? <>{label.slice(0, -2)}<span className="text-ui-required"> *</span></> : label}</label>
    <div data-testid="upload-dropzone" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (!event.currentTarget.closest("fieldset")?.disabled) choose([...event.dataTransfer.files]); }} className="flex flex-wrap items-center gap-4 rounded-[18px] border-[1.5px] border-dashed border-ui-ink/22 bg-white/55 p-[22px]">
      <span aria-hidden="true" className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] bg-ui-blue-surface text-ui-blue-text"><PublicIcon name="upload" size={22} /></span>
      <div className="min-w-0 flex-[1_1_180px] space-y-[3px]"><p className="text-[14.5px] font-bold">Drop a file here or choose one</p><p id={`${inputId}-help`} className="text-[12.5px] text-ui-muted">{accept.join(", ").toUpperCase()} · up to {maxMb} MB {multiple ? "each" : ""}</p></div>
      <input ref={input} id={inputId} aria-label={label} aria-describedby={`${inputId}-help`} type="file" multiple={multiple} accept={accept.map((ext) => `.${ext}`).join(",")}
      disabled={uploading} className="sr-only"
      onChange={(event) => {
        const chosen = [...(event.target.files ?? [])]; event.target.value = "";
        choose(chosen);
      }} />
      <button type="button" disabled={uploading} onClick={() => input.current?.click()} className="rounded-xl border border-white/80 bg-white/70 px-[18px] py-[11px] text-[14px] font-bold disabled:opacity-50">Choose file</button>
    </div>
    <p className="mt-2 text-[12.5px] text-ui-muted">Up to 8 files per application. Removed files still count toward this limit; use Start fresh uploads to reset it.</p>
    {message && <p role="alert" className="mt-2 text-[13px] text-red-700">{message}</p>}
    <ul className="mt-3 space-y-3">{items.map((item) => <li key={item.key} className="rounded-[14px] border border-ui-border bg-white/70 p-3">
      <p className="break-all text-sm">{item.file.name} ({Math.ceil(item.file.size / 1024)} KB)</p>
      {item.status === "uploading" ? <><progress max={100} value={item.progress} aria-label={`${item.file.name} upload progress`} /><span className="ml-2">{item.progress}%</span></> : item.status === "done" ? <p className="text-sm">Uploaded</p> : <p role="alert" className="text-sm">{item.error}</p>}
      {item.status === "error" && <button type="button" onClick={() => void upload(item)} className="mr-4 underline">Retry upload</button>}
      {item.status !== "uploading" && <button type="button" onClick={() => publish(items.filter((i) => i.key !== item.key))} className="underline">Remove file</button>}
    </li>)}</ul>
  </UploadState>;
}

function UploadState({ children, signature, onChange, label }: { children: React.ReactNode; signature: string; onChange: (ids: string[]) => void; label: string }) {
  useEffect(() => { onChange(signature ? signature.split(",") : []); }, [signature, onChange]);
  return <section aria-label={`${label} upload`}>{children}</section>;
}
