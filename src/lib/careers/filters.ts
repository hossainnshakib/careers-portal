import { parseAsArrayOf, parseAsString } from "nuqs/server";

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
export type PublicBrand = {
  id: string; name: string; slug: string; sector: string; logoUrl: string | null;
  description: string; accentColor: string | null;
};
export type JobCard = {
  id: string; title: string; slug: string; summary: string; employmentType: string;
  workMode: string; experienceLevel: string | null; locationText: string | null;
  department: { name: string; slug: string }; brands: PublicBrand[]; primaryBrandId: string;
};
export const emptyFilters: Filters = { brand: [], dept: [], type: [], mode: [], sector: [], level: [], q: "" };
export function matchesJob(job: JobCard, filters: Filters, omit?: FilterKey): boolean {
  const values: Record<FilterKey, string[]> = {
    brand: job.brands.map((b) => b.slug), dept: [job.department.slug],
    type: [job.employmentType], mode: [job.workMode], sector: job.brands.map((b) => b.sector),
    level: job.experienceLevel ? [job.experienceLevel] : [],
  };
  return job.title.toLocaleLowerCase().includes(filters.q.trim().toLocaleLowerCase()) &&
    filterKeys.every((key) => key === omit || !filters[key].length || filters[key].some((v) => values[key].includes(v)));
}
/** Facet counts apply every other filter, so adding an OR option remains possible. */
export function optionCount(jobs: JobCard[], filters: Filters, key: FilterKey, value: string) {
  return jobs.filter((job) => matchesJob(job, { ...filters, [key]: [value] })).length;
}
export function humanize(value: string) { return value.replaceAll("_", " "); }
