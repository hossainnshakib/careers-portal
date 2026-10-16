/** Date and time controls share the same local-time instant; clearing the date clears it. */
export function editLocalDeadline(iso: string | null, date: string, time?: string): string | null {
  if (!date) return null;
  const existing = iso ? new Date(iso) : null;
  const clock = time ?? (existing ? `${String(existing.getHours()).padStart(2, "0")}:${String(existing.getMinutes()).padStart(2, "0")}:${String(existing.getSeconds()).padStart(2, "0")}.${String(existing.getMilliseconds()).padStart(3, "0")}` : "00:00");
  const result = new Date(`${date}T${clock || "00:00"}`);
  return Number.isFinite(result.getTime()) ? result.toISOString() : null;
}
