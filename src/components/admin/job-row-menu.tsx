"use client";

import { useEffect, useRef, useState } from "react";
import type { Job } from "@/db/schema";
import { jobCommandAction } from "@/app/admin/(protected)/jobs/actions";

/**
 * Jobs row actions from the mockup board (Edit / Duplicate / Close job /
 * Reopen job). Rendered as a disclosure rather than an ARIA menu, so plain
 * links and buttons stay keyboard-operable.
 */
export function JobRowMenu({ id, title, status }: { id: string; title: string; status: Job["status"] }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const wrapper = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    function onMouseDown(event: MouseEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [open]);

  async function run(command: "duplicate" | "close" | "reopen") {
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
    <span className="admin-menu" ref={wrapper}>
      <button
        ref={trigger}
        type="button"
        className="admin-btn admin-btn-secondary admin-icon-btn"
        aria-label={`Actions for ${title}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        ⋯
      </button>
      {open && (
        <span className="admin-menu-panel">
          <a href={`/admin/jobs/${id}/edit`}>Edit</a>
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
          {message && <span className="admin-error">{message}</span>}
        </span>
      )}
    </span>
  );
}
