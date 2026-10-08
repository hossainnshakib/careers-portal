export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Call under the write transaction's lock; the DB unique constraint is the backstop. */
export function uniqueSlug(base: string, existing: ReadonlySet<string>): string {
  if (!existing.has(base)) return base;
  for (let suffix = 2; ; suffix++) {
    const value = `${base}-${suffix}`;
    if (!existing.has(value)) return value;
  }
}
