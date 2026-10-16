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
      const result = await jobCommandAction({ id, command });
      if (result.ok) {
        setOpen(false);
        if (command === "duplicate") window.location.assign(`/admin/jobs/${result.data.id}/edit`);
        else window.location.reload();
      } else setMessage(result.error);
    } catch {
      setMessage("Unable to update the job. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="admin-menu" ref={wrapper} onBlur={(event) => { if (!pending && !event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
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
          {status === "draft" && applicationCount === 0 && <button type="button" disabled={pending} onClick={() => confirmation.current?.showModal()}>Delete draft</button>}
          {message && <span role="status" className="admin-error">{message}</span>}
        </span>
      )}
      <dialog ref={confirmation} aria-label={`Delete draft ${title}`} onCancel={(event) => { if (pending) event.preventDefault(); }}>
        <div className="admin-kicker">Delete</div><h2>Delete this draft?</h2><p>{title}</p>
        <p className="admin-muted">This removes the draft and its questions. This cannot be undone.</p>
        <div className="admin-inline" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="admin-btn admin-btn-secondary" disabled={pending} onClick={() => confirmation.current?.close()}>Cancel</button>
          <button type="button" className="admin-btn admin-btn-danger" disabled={pending} onClick={async () => { await run("delete"); confirmation.current?.close(); }}> {pending ? "Deleting…" : "Delete draft"}</button>
        </div>
      </dialog>
    </span>
  );
}
