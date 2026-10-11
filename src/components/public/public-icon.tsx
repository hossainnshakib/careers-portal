type IconName = "arrow" | "down" | "external" | "back" | "search" | "close" | "check" | "upload";

const paths: Record<Exclude<IconName, "search">, string> = {
  arrow: "M5 12h14M13 6l6 6-6 6", down: "M12 5v14M6 13l6 6 6-6",
  external: "M7 17L17 7M8 7h9v9", back: "M19 12H5M11 6l-6 6 6 6",
  close: "M6 6l12 12M18 6L6 18", check: "M5 12.5l4.2 4.2L19 7", upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
};

export function PublicIcon({ name, size = 17 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    {name === "search" ? <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></> : <path d={paths[name]} />}
  </svg>;
}
