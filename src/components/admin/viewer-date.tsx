"use client";

import { useEffect, useState } from "react";

export function ViewerDate({ iso }: { iso: string }) {
  const [text, setText] = useState(() => `${new Date(iso).toLocaleString("en-GB", { timeZone: "UTC" })} UTC`);
  useEffect(() => { setText(new Date(iso).toLocaleString()); }, [iso]);
  return <time dateTime={iso}>{text}</time>;
}
