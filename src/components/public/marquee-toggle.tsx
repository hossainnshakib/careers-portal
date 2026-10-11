"use client";

import { useEffect, useState } from "react";

/**
 * Pause/Play toggle for the brand-logo marquee.
 * Default: playing. Under prefers-reduced-motion the marquee is static (CSS),
 * so the toggle is hidden. The marquee container carries data-marquee-paused.
 */
export function MarqueeToggle({ targetId }: { targetId: string }) {
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (target) target.setAttribute("data-marquee-paused", String(paused));
  }, [paused, targetId]);

  if (reduced) return null;
  return (
    <button
      type="button"
      onClick={() => setPaused(value => !value)}
      aria-pressed={paused}
      aria-controls={targetId}
      className="ml-2 inline-flex h-7 items-center gap-1.5 rounded-full border border-ui-border bg-white/70 px-2.5 text-[11px] font-bold text-ui-muted transition-colors hover:text-ui-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-blue"
    >
      <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
        {paused ? <path d="M2 1.5v7l6.5-3.5z" /> : <><rect x="2" y="1.5" width="2.2" height="7" rx="0.5" /><rect x="5.8" y="1.5" width="2.2" height="7" rx="0.5" /></>}
      </svg>
      {paused ? "Play" : "Pause"}
    </button>
  );
}
