"use client";

import { useRef, useState } from "react";
import { applicationStatusEnum, type Application } from "@/db/schema";
import { addNoteAction, changeStatusAction, deleteApplicationAction, deleteNoteAction } from "@/app/admin/(protected)/applications/actions";
import type { ActionResult } from "@/lib/actions/result";
import { applicationStatusLabel } from "@/lib/admin/display";

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
  return (
    <section aria-label="Review controls" className="admin-card">
      <form
        className="admin-stack"
        onSubmit={(event) => { event.preventDefault(); void update(() => changeStatusAction({ applicationId, status: selected }), "Status updated."); }}
      >
        <label>
          Application status
          <select
            aria-label="Application status"
            value={selected}
            onChange={(event) => setSelected(event.target.value as Application["status"])}
            disabled={pending}
          >
            {applicationStatusEnum.enumValues.map((value) => (
              <option key={value} value={value}>{applicationStatusLabel(value)}</option>
            ))}
          </select>
        </label>
        <div>
          <button disabled={pending} className="admin-btn admin-btn-secondary admin-btn-sm">Update status</button>
        </div>
      </form>
      <form
        className="admin-stack"
        style={{ marginTop: 16 }}
        onSubmit={(event) => { event.preventDefault(); void update(() => addNoteAction({ applicationId, note }), "Note added."); }}
      >
        <label>
          Internal note
          <textarea
            aria-label="Internal note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={10000}
            disabled={pending}
          />
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="admin-dot" aria-hidden="true" />
          <span className="admin-note">Internal notes are never shared with candidates.</span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button disabled={pending || !note.trim()} className="admin-btn admin-btn-sm">Add note</button>
          <span className="admin-note">Visible to the hiring team only.</span>
        </div>
      </form>
      <p role="status" aria-live="polite" className="admin-error">{message}</p>
    </section>
  );
}
export function DeleteNoteButton({ applicationId, noteId }: { applicationId: string; noteId: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  return <div><button type="button" disabled={pending} className="admin-link" style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }} onClick={async () => {
    setPending(true);
    try { const result = await deleteNoteAction({ applicationId, noteId }); if (result.ok) window.location.reload(); else setMessage(result.error); }
    catch { setMessage("Unable to delete note."); }
    finally { setPending(false); }
  }}>Delete own note</button><p role="status" className="admin-error">{message}</p></div>;
}
export function DeleteApplicationControl({ applicationId, reference, retry = false }: { applicationId: string; reference: string; retry?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <section aria-label="Application deletion">
      <button
        type="button"
        className="admin-btn admin-btn-danger"
        style={{ width: "100%" }}
        onClick={() => dialog.current?.showModal()}
      >
        {retry ? "Retry deletion cleanup" : "Delete application"}
      </button>
      <dialog ref={dialog} aria-label="Confirm application deletion">
        <h2>Delete {reference}?</h2>
        <p className="admin-muted">This removes the application, answers, notes, history and uploaded files. This cannot be undone.</p>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <button disabled={pending} onClick={() => dialog.current?.close()} className="admin-btn admin-btn-secondary">Cancel</button>
          <button
            disabled={pending}
            className="admin-btn admin-btn-danger"
            onClick={async () => {
              setPending(true); setMessage("");
              try {
                const result = await deleteApplicationAction({ applicationId, confirmed: true });
                if (result.ok) { dialog.current?.close(); window.location.replace("/admin/applications"); }
                else { setMessage(result.error); dialog.current?.close(); }
              } catch { setMessage("Unable to delete application. Try again."); }
              finally { setPending(false); }
            }}
          >
            {pending ? "Deleting…" : "Confirm deletion"}
          </button>
        </div>
      </dialog>
      <p role="status" className="admin-error">{message}</p>
      {message && <a href={`/admin/applications?cleanup=${applicationId}`} className="admin-link">Retry this deletion from the applications list</a>}
    </section>
  );
}
