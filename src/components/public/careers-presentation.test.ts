import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import type { JobCard, PublicBrand } from "@/lib/careers/filters";
import { CareersHero } from "./careers-hero";
import { CareersResults } from "./careers-results";

const primary: PublicBrand = { id: "primary", slug: "primary", name: "Primary", sector: "other", logoUrl: null, description: "", accentColor: "#2B95A0" };
const idle: PublicBrand = { ...primary, id: "idle", slug: "idle", name: "Idle" };
const role: JobCard = {
  id: "role", slug: "synthetic-role", title: "সৃজনশীল কাজ", summary: "A real catalog summary",
  locationText: null, engagementNote: null, salaryMode: "range", salaryText: "৳ 20,000 – 30,000",
  vacancies: null, experienceText: null, department: { name: "Creative", slug: "creative" },
  brands: [primary], primaryBrandId: primary.id,
  options: [{ group: "engagement", slug: "custom", label: "Exact custom label" }, { group: "experience", slug: "fresher-welcome", label: "নতুনদের স্বাগতম" }],
};

it("counts hiring brands rather than all active brands and features the first catalog role", () => {
  const html = renderToStaticMarkup(createElement(CareersHero, { jobs: [role], brands: [primary, idle] }));
  expect(html).toContain("1 brand hiring");
  expect(html).not.toContain("2 brands hiring");
  expect(html).toContain('href="/jobs/synthetic-role"');
  expect(html).toContain(role.title);
  // Non-hiring active brands still have a shareable logo filter link.
  expect(html).toContain('href="/?brand=idle#roles"');
  expect(html).toContain('tabindex="-1"');
  expect(html).toContain('aria-hidden="true" class="brand-marquee-copy"');
  expect(html).not.toContain("roles-marquee");
});

it("cards retain Bengali, verbatim experience labels, salary mode and primary-brand styling", () => {
  const render = (job: JobCard) => renderToStaticMarkup(createElement(CareersResults, { jobs: [job], departments: [role.department], onClear: () => {} }));
  const html = render(role);
  expect(html).toContain(role.title);
  expect(html).toContain("Exact custom label");
  expect(html).toContain("নতুনদের স্বাগতম");
  expect(html).not.toContain("Fresher welcome");
  expect(html).toContain('class="ui-pill ui-pill-blue"');
  expect(html).toContain(role.salaryText);
  expect(html).toContain("border-top-color:#2B95A0");
  const negotiable = render({ ...role, salaryMode: "negotiable", salaryText: "Ignored stale text" });
  expect(negotiable).toContain("Negotiable");
  expect(negotiable).not.toContain("Ignored stale text");
  // Regression: a stored range row with blank text falls back to "Negotiable" on the public site.
  // The DB CHECK constraint now prevents new rows in this state; the renderer stays defensive.
  const blankRange = render({ ...role, salaryMode: "range", salaryText: "" });
  expect(blankRange).toContain("Negotiable");
  expect(blankRange).not.toContain("৳ 20,000");
});

it("empty catalog hides the hiring pill counts, marquee and floating stats card", () => {
  const html = renderToStaticMarkup(createElement(CareersHero, { jobs: [], brands: [primary, idle] }));
  expect(html).toContain("No open roles right now");
  expect(html).not.toContain("0 open roles");
  expect(html).not.toContain("0 brands");
  expect(html).not.toContain("brand-marquee");
  expect(html).not.toContain("Hiring statistics");
  expect(html).not.toContain("Browse roles");
  expect(html).toContain("How applying works");
});

it("no-match results show a friendly message and a working Clear filters button", () => {
  const withFilters = renderToStaticMarkup(createElement(CareersResults, { jobs: [], departments: [], onClear: () => {}, activeFilters: true }));
  expect(withFilters).toContain("No roles match your filters");
  expect(withFilters).toContain("Clear filters");
  const searchOnly = renderToStaticMarkup(createElement(CareersResults, { jobs: [], departments: [], onClear: () => {}, activeFilters: false }));
  expect(searchOnly).toContain("No roles found");
  expect(searchOnly).not.toContain("No roles match your filters");
});
