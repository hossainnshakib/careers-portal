import { parseAsArrayOf, parseAsString } from "nuqs/server";
import type { OptionGroup, OptionTag } from "./option-labels";

/**
 * URL filter contract. Param names are stable (brand links rely on them) and
 * `mode`/`type`/`level` hold option slugs: legacy enum values such as `onsite`
 * and `full_time` are valid slugs, so old shared URLs keep working.
 */
export const filterKeys = ["brand", "dept", "type", "mode", "sector", "level"] as const;
export type FilterKey = (typeof filterKeys)[number];
export const filterParsers = {
  brand: parseAsArrayOf(parseAsString).withDefault([]),
  dept: parseAsArrayOf(parseAsString).withDefault([]),
  type: parseAsArrayOf(parseAsString).withDefault([]),
  mode: parseAsArrayOf(parseAsString).withDefault([]),
  sector: parseAsArrayOf(parseAsString).withDefault([]),
  level: parseAsArrayOf(parseAsString).withDefault([]),
  q: parseAsString.withDefault(""),
};
export type Filters = Record<FilterKey, string[]> & { q: string };
/** Which option group each URL param filters by. */
export const filterGroup: Partial<Record<FilterKey, OptionGroup>> = {
  mode: "arrangement",
  type: "engagement",
  level: "experience",
};
export type PublicBrand = {
  id: string; name: string; slug: string; sector: string; logoUrl: string | null;
  description: string; accentColor: string | null;
  website?: string | null;
};
export type JobCard = {
  id: string; title: string; slug: string; summary: string;
  locationText: string | null; engagementNote: string | null;
  salaryMode: string; salaryText: string | null; vacancies: number | null;
  experienceText: string | null;
  options: OptionTag[];
  department: { name: string; slug: string }; brands: PublicBrand[]; primaryBrandId: string;
};
export const emptyFilters: Filters = { brand: [], dept: [], type: [], mode: [], sector: [], level: [], q: "" };
export function matchesJob(job: JobCard, filters: Filters, omit?: FilterKey): boolean {
  const values: Record<FilterKey, string[]> = {
    brand: job.brands.map((b) => b.slug),
    dept: [job.department.slug],
    sector: job.brands.map((b) => b.sector),
    mode: job.options.filter((o) => o.group === "arrangement").map((o) => o.slug),
    type: job.options.filter((o) => o.group === "engagement").map((o) => o.slug),
    level: job.options.filter((o) => o.group === "experience").map((o) => o.slug),
  };
  return job.title.toLocaleLowerCase().includes(filters.q.trim().toLocaleLowerCase()) &&
    filterKeys.every((key) => key === omit || !filters[key].length || filters[key].some((v) => values[key].includes(v)));
}
/** Facet counts apply every other filter, so adding an OR option remains possible. */
export function optionCount(jobs: JobCard[], filters: Filters, key: FilterKey, value: string) {
  return jobs.filter((job) => matchesJob(job, { ...filters, [key]: [value] })).length;
}
export function humanize(value: string) { return value.replaceAll("_", " "); }
