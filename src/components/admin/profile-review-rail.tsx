"use client";

import { useEffect, useRef } from "react";

export function ProfileReviewRail({ children }: { children: React.ReactNode }) {
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 801px)");
    const expand = () => { if (desktop.matches && details.current) details.current.open = true; };
    expand();
    desktop.addEventListener("change", expand);
    return () => desktop.removeEventListener("change", expand);
  }, []);
  return <details ref={details} className="admin-rail-details admin-card" open>
    <summary className="admin-rail-summary">Status, notes &amp; downloads</summary>
    {children}
  </details>;
}
