"use client";

import { useEffect, useState } from "react";
import { mimeByExtension } from "@/lib/validation/uploads";

type UploadItem = { key: string; file: File; id?: string; progress: number; status: "uploading" | "done" | "error"; error?: string };
export type PrepareUpload = (file: File, slot: string, uploadId?: string) => Promise<{ uploadId: string; signedUrl: string; uploaded?: boolean }>;
export function UploadWidget({ label, slot, accept, maxMb, multiple = false, prepare, onChange, onBusy }: {
  label: string; slot: string; accept: string[]; maxMb: number; multiple?: boolean;
  prepare: PrepareUpload; onChange: (ids: string[]) => void; onBusy: (delta: number) => void;
}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [message, setMessage] = useState("");
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
  // This effect synchronizes the upload state with the parent form.
  return <UploadState label={label} signature={signature} onChange={onChange}>
    <label className="block font-medium">{label}<input aria-label={label} type="file" multiple={multiple} accept={accept.map((ext) => `.${ext}`).join(",")}
      disabled={items.some((i) => i.status === "uploading")} className="mt-2 block w-full rounded border border-input p-3"
      onChange={(event) => {
        const chosen = [...(event.target.files ?? [])]; event.target.value = "";
        if ((!multiple && items.length + chosen.length > 1) || items.length + chosen.length > 8) { setMessage("Remove an existing file before choosing another."); return; }
        if (chosen.some((file) => !file.size || file.size > maxMb * 1024 * 1024 || !accept.includes((file.name.split(".").at(-1)?.toLowerCase() ?? "").replace(/^jpeg$/, "jpg")))) { setMessage(`Choose permitted files up to ${maxMb} MB each.`); return; }
        setMessage("");
        const additions: UploadItem[] = chosen.map((file) => ({ key: crypto.randomUUID(), file, progress: 0, status: "uploading" }));
        setItems((current) => [...current, ...additions]);
        for (const item of additions) void upload(item);
      }} /></label>
    <p className="mt-2 text-sm text-muted-foreground">{accept.join(", ").toUpperCase()} · up to {maxMb} MB each. Eight upload slots per application, including removed files.</p>
    {message && <p role="alert">{message}</p>}
    <ul className="mt-3 space-y-3">{items.map((item) => <li key={item.key} className="rounded border border-border p-3">
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
