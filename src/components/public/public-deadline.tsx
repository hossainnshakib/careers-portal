"use client";

import { useEffect, useState } from "react";

/** Hydrate in the viewer's timezone; the initial UTC date is deterministic. */
export function PublicDeadline({ value }: { value: string }) {
  const [local, setLocal] = useState(false);
  useEffect(() => setLocal(true), []);
  const date = new Date(value);
  const label = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", ...(local ? {} : { timeZone: "UTC" }) }).format(date);
  return <time dateTime={value}>{label}</time>;
}
