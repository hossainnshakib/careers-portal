"use client";

import { useEffect, useState } from "react";
export function PdfDownload({ applicationId }: { applicationId: string }) {
  const [notes, setNotes] = useState(false);
  const [format, setFormat] = useState({ tz: "UTC", locale: "en-GB" });
  useEffect(() => { setFormat({ tz: Intl.DateTimeFormat().resolvedOptions().timeZone, locale: navigator.language }); }, []);
  const query = new URLSearchParams({ notes: notes ? "1" : "0", ...format });
  return <div className="my-4 space-y-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={notes} onChange={(event) => setNotes(event.target.checked)} />Include internal notes in PDF</label>
    <a href={`/api/admin/applications/${applicationId}/pdf?${query}`} className="block rounded border border-border p-3 text-center font-medium">Download Profile PDF</a>
  </div>;
}
