"use client";

import { useRef, useState } from "react";
import { applicationStatusEnum, type Application } from "@/db/schema";
import { addNoteAction, changeStatusAction, deleteApplicationAction, deleteNoteAction } from "@/app/admin/(protected)/applications/actions";
import type { ActionResult } from "@/lib/actions/result";

export function ReviewControls({ applicationId, status }: { applicationId: string; status: Application["status"] }) {
  const [selected, setSelected] = useState(status);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function update(work: () => Promise<ActionResult>, success: string) {
    setPending(true); setMessage("");
    try {
      const result = await work();
      if (!result.ok) setMessage(result.error);
      else { setMessage(success); if (success === "Note added.") setNote(""); window.location.reload(); }
    } catch { setMessage("Unable to update application. Try again."); }
    finally { setPending(false); }
  }
  return <section aria-label="Review controls" className="space-y-5 rounded border border-border bg-card p-5">
    <form onSubmit={(event) => { event.preventDefault(); void update(() => changeStatusAction({ applicationId, status: selected }), "Status updated."); }}>
      <label className="font-semibold">Application status<select aria-label="Application status" value={selected} onChange={(event) => setSelected(event.target.value as Application["status"])} disabled={pending} className="my-2 block w-full rounded border border-input p-2">{applicationStatusEnum.enumValues.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
      <button disabled={pending} className="rounded border border-border px-3 py-2 disabled:opacity-50">Update status</button>
    </form>
    <form onSubmit={(event) => { event.preventDefault(); void update(() => addNoteAction({ applicationId, note }), "Note added."); }}>
      <label className="font-semibold">Internal note<textarea aria-label="Internal note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={10000} disabled={pending} className="my-2 block min-h-28 w-full rounded border border-input p-2" /></label>
      <p className="mb-3 text-xs text-muted-foreground">Visible to the hiring team only.</p>
      <button disabled={pending || !note.trim()} className="rounded border border-border px-3 py-2 disabled:opacity-50">Add note</button>
    </form>
    <p role="status" aria-live="polite">{message}</p>
  </section>;
}
export function DeleteNoteButton({ applicationId, noteId }: { applicationId: string; noteId: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  return <div><button type="button" disabled={pending} className="mt-2 text-sm underline" onClick={async () => {
    setPending(true);
    try { const result = await deleteNoteAction({ applicationId, noteId }); if (result.ok) window.location.reload(); else setMessage(result.error); }
    catch { setMessage("Unable to delete note."); }
    finally { setPending(false); }
  }}>Delete own note</button><p role="status">{message}</p></div>;
}
export function DeleteApplicationControl({ applicationId, reference, retry = false }: { applicationId: string; reference: string; retry?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  return <section aria-label="Application deletion" className="rounded border border-border p-5">
    <button type="button" className="text-destructive underline" onClick={() => dialog.current?.showModal()}>{retry ? "Retry deletion cleanup" : "Delete application"}</button>
    <dialog ref={dialog} aria-label="Confirm application deletion" className="max-w-lg rounded-xl border border-border bg-card p-6 text-foreground backdrop:bg-black/40">
      <h2 className="text-xl font-semibold">Delete {reference}?</h2>
      <p className="my-4">This removes the application, answers, notes, history and uploaded files. This cannot be undone.</p>
      <div className="flex gap-4"><button disabled={pending} onClick={() => dialog.current?.close()} className="underline">Cancel</button>
        <button disabled={pending} className="rounded bg-destructive px-4 py-2 text-white disabled:opacity-50" onClick={async () => {
          setPending(true); setMessage("");
          try {
            const result = await deleteApplicationAction({ applicationId, confirmed: true });
            if (result.ok) { dialog.current?.close(); window.location.replace("/admin/applications"); }
            else { setMessage(result.error); dialog.current?.close(); }
          } catch { setMessage("Unable to delete application. Try again."); }
          finally { setPending(false); }
        }}>{pending ? "Deleting…" : "Confirm deletion"}</button></div>
    </dialog>
    <p role="status" className="mt-3">{message}</p>
    {message && <a href={`/admin/applications?cleanup=${applicationId}`} className="text-sm underline">Retry this deletion from the applications list</a>}
  </section>;
}
