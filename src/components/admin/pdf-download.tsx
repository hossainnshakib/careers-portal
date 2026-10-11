"use client";

import { useEffect, useState } from "react";
export function PdfDownload({ applicationId }: { applicationId: string }) {
  const [notes, setNotes] = useState(false);
  const [format, setFormat] = useState({ tz: "UTC", locale: "en-GB" });
  useEffect(() => { setFormat({ tz: Intl.DateTimeFormat().resolvedOptions().timeZone, locale: navigator.language }); }, []);
  const query = new URLSearchParams({ notes: notes ? "1" : "0", ...format });
  return (
    <div className="admin-card admin-stack">
      <a
        href={`/api/admin/applications/${applicationId}/pdf?${query}`}
        className="admin-btn"
        style={{ width: "100%" }}
      >
        Download Profile PDF
      </a>
      <label className="admin-inline">
        <input type="checkbox" checked={notes} onChange={(event) => setNotes(event.target.checked)} />
        Include internal notes in PDF
      </label>
    </div>
  );
}
