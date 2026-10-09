import { expect, it } from "vitest";
import { emptyFilters, matchesJob, optionCount, type JobCard, type PublicBrand } from "./filters";

const brand = (slug: string, sector: string): PublicBrand => ({ id: slug, slug, sector, name: slug, logoUrl: null, description: "", accentColor: null });
const cards: JobCard[] = [
  { id: "1", title: "Web Developer", slug: "web", summary: "", locationText: null, engagementNote: null,
    salaryMode: "negotiable", salaryText: null, vacancies: null, experienceText: null,
    options: [
      { group: "arrangement", slug: "remote", label: "Work from home" },
      { group: "engagement", slug: "full_time", label: "Full-time" },
      { group: "experience", slug: "mid", label: "Mid-level" },
    ],
    department: { name: "Technical", slug: "tech" }, brands: [brand("a", "technology"), brand("b", "media")], primaryBrandId: "a" },
  { id: "2", title: "Video Editor", slug: "video", summary: "", locationText: null, engagementNote: null,
    salaryMode: "negotiable", salaryText: null, vacancies: null, experienceText: null,
    options: [
      { group: "arrangement", slug: "onsite", label: "On-site" },
      { group: "engagement", slug: "part_time", label: "Part-time" },
    ],
    department: { name: "Creative", slug: "creative" }, brands: [brand("b", "media")], primaryBrandId: "b" },
  { id: "3", title: "Backend Developer", slug: "backend", summary: "", locationText: null, engagementNote: null,
    salaryMode: "negotiable", salaryText: null, vacancies: null, experienceText: null,
    options: [
      { group: "arrangement", slug: "remote", label: "Work from home" },
      { group: "engagement", slug: "contract", label: "Duration-based" },
      { group: "experience", slug: "senior", label: "Senior" },
    ],
    department: { name: "Technical", slug: "tech" }, brands: [brand("c", "technology")], primaryBrandId: "c" },
];
it("uses OR within a filter and AND across filters, including linked brands/sectors", () => {
  const filters = { ...emptyFilters, brand: ["a", "c"], mode: ["remote"], sector: ["media"] };
  expect(cards.filter((job) => matchesJob(job, filters)).map((job) => job.id)).toEqual(["1"]);
  expect(cards.filter((job) => matchesJob(job, { ...emptyFilters, type: ["part_time", "contract"] })).map((job) => job.id)).toEqual(["2", "3"]);
});
it("searches only titles, case-insensitively, and supports nullable levels", () => {
  expect(cards.filter((job) => matchesJob(job, { ...emptyFilters, q: " DEVELOPER " }))).toHaveLength(2);
  expect(cards.filter((job) => matchesJob(job, { ...emptyFilters, level: ["senior"] })).map((job) => job.id)).toEqual(["3"]);
  expect(cards.filter((job) => matchesJob(job, { ...emptyFilters, q: "Technical" }))).toHaveLength(0);
});
it("facet counts honor other filters, ignore the facet's current selection and count multi-brand jobs once", () => {
  const filters = { ...emptyFilters, brand: ["a"], dept: ["tech"] };
  expect(optionCount(cards, filters, "brand", "c")).toBe(1);
  expect(optionCount(cards, filters, "brand", "b")).toBe(1);
  expect(optionCount(cards, { ...filters, q: "Video" }, "brand", "b")).toBe(0);
  expect(optionCount(cards, emptyFilters, "sector", "media")).toBe(2);
});
