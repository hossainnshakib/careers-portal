"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Job } from "@/db/schema";
import { jobCommandAction } from "@/app/admin/(protected)/jobs/actions";

/**
 * Jobs row actions from the mockup board (Edit / Duplicate / Close job /
 * Reopen job). Rendered as a disclosure rather than an ARIA menu, so plain
 * links and buttons stay keyboard-operable.
 */
export function JobRowMenu({ id, title, status, applicationCount = 0 }: { id: string; title: string; status: Job["status"]; applicationCount?: number }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const wrapper = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLSpanElement>(null);
  const confirmation = useRef<HTMLDialogElement>(null);
  const deleteTrigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const [above, setAbove] = useState(false);

  useEffect(() => {
    if (!open) return;
    const box = panel.current?.getBoundingClientRect();
    setAbove(Boolean(box && box.bottom > window.innerHeight - 8));
    panel.current?.querySelector<HTMLAnchorElement>("a")?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (confirmation.current?.open) return;
      if (event.key === "Escape" && !pending) {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    function onMouseDown(event: MouseEvent) {
      if (confirmation.current?.open) return;
      if (!pending && !wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onMouseDown);
    };
  }, [open, pending]);

  async function run(command: "duplicate" | "close" | "reopen" | "delete") {
    setPending(true);
    setMessage("");
    try {
      const result = await jobCommandAction({
        id,
        command,
        ...(command === "delete" ? { confirmed: true } : {}),
      });
      if (result.ok) {
        setOpen(false);
        if (command === "duplicate") window.location.assign(`/admin/jobs/${result.data.id}/edit`);
        else if (command === "delete") {
          // Keep the admin's filters and add a precise success notice for the list.
          const next = new URLSearchParams(window.location.search);
          next.set("deleted", "1");
          window.location.assign(`/admin/jobs?${next.toString()}`);
        } else window.location.reload();
      } else { setMessage(result.error); return false; }
      return true;
    } catch {
      setMessage("Unable to update the job. Try again.");
      return false;
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="admin-menu" ref={wrapper} onBlur={(event) => { if (!pending && !confirmation.current?.open && !event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <button
        ref={trigger}
        type="button"
        className="admin-btn admin-btn-secondary admin-icon-btn"
        aria-label={`Actions for ${title}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => { if (!pending) setOpen((value) => !value); }}
      >
        ⋯
      </button>
      {open && (
        <span ref={panel} id={panelId} className={`admin-menu-panel${above ? " is-above" : ""}`} aria-busy={pending}>
          <a href={`/admin/jobs/${id}/edit`} aria-disabled={pending} onClick={(event) => { if (pending) event.preventDefault(); }}>Edit</a>
          <button type="button" disabled={pending} onClick={() => void run("duplicate")}>
            Duplicate
          </button>
          {status === "open" ? (
            <button type="button" disabled={pending} onClick={() => void run("close")}>
              Close job
            </button>
          ) : null}
          {status === "closed" ? (
            <button type="button" disabled={pending} onClick={() => void run("reopen")}>
              Reopen job
            </button>
          ) : null}
          {applicationCount === 0 && (
            <button ref={deleteTrigger} type="button" disabled={pending} onClick={() => { setMessage(""); confirmation.current?.showModal(); }}>
              {status === "draft" ? "Delete draft" : "Delete job"}
            </button>
          )}
          {applicationCount > 0 && <span className="admin-muted">Jobs with applications cannot be deleted. Close an open job instead; application snapshots, files and history are preserved.</span>}
          {message && <span role="status" className="admin-error">{message}</span>}
        </span>
      )}
      <dialog ref={confirmation} className="admin-delete-dialog" aria-label="Confirm job deletion" onClose={() => deleteTrigger.current?.focus()} onCancel={(event) => { if (pending) event.preventDefault(); }}>
        <div className="admin-kicker">Delete</div><h2>{status === "draft" ? "Delete this draft?" : "Delete this job?"}</h2><p>{title}</p>
        <p className="admin-muted">
          {status === "draft"
            ? "This removes the draft and its questions. This cannot be undone."
            : "This permanently removes the job, its questions and its public page. This cannot be undone."}
        </p>
        {message && <p role="status" className="admin-error">{message}</p>}
        <div className="admin-inline" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="admin-btn admin-btn-secondary" disabled={pending} onClick={() => confirmation.current?.close()}>Cancel</button>
          <button type="button" className="admin-btn admin-btn-danger" disabled={pending} onClick={async () => { if (await run("delete")) confirmation.current?.close(); }}> {pending ? "Deleting…" : status === "draft" ? "Delete draft" : "Delete job"}</button>
        </div>
      </dialog>
    </span>
  );
}
