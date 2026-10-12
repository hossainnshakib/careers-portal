import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rows: vi.fn(), gate: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/requireAdmin", () => ({ requireAdmin: mocks.gate }));
vi.mock("@/db/queries/jobs", () => ({ listJobs: mocks.rows, listJobBrandMarks: async () => [{ jobId: "fixture", id: "brand", name: "Fixture", accentColor: "#123456", logoUrl: "/fixture.svg" }], jobApplicationCounts: async () => [{ jobId: "fixture", count: 2 }] }));
vi.mock("@/db/queries/job-options", () => ({ jobOptionsFor: async () => new Map([["fixture", [{ group: "engagement", label: "Custom option" }]]]) }));
vi.mock("@/db/queries/brands", () => ({ listBrands: async () => [] }));
vi.mock("@/db/queries/departments", () => ({ listDepartments: async () => [] }));
vi.mock("@/app/admin/(protected)/jobs/actions", () => ({ jobCommandAction: vi.fn() }));
import JobsPage from "./page";

beforeEach(() => { mocks.gate.mockResolvedValue({ userId: "admin" }); mocks.rows.mockResolvedValue([]); });

it("uses the drawn compact filter order, real columns, initials and exact option/salary values", async () => {
  mocks.rows.mockResolvedValue([{ id: "fixture", title: "Synthetic role", department: "Technical", status: "open", salaryMode: "range", salaryText: "৳ 30,000 – 50,000 / month", updatedAt: new Date("2026-10-09T01:42:00Z") }]);
  const html = renderToStaticMarkup(await JobsPage({ searchParams: Promise.resolve({}) }));
  const filterHtml = html.slice(html.indexOf('class="admin-card admin-job-filters"'));
  const order = ["status", "department", "brand", "q"].map((name) => filterHtml.indexOf(`name="${name}"`));
  expect(order.every((index) => index >= 0)).toBe(true);
  expect(order).toEqual([...order].sort((a, b) => a - b));
  expect(html).toContain('aria-label="Filter jobs"'); expect(html).toContain('aria-label="Clear filters"');
  for (const name of ["Title", "Department", "Brands", "Options", "Salary", "Status", "Apps", "Updated"]) expect(html).toContain(`>${name}</th>`);
  expect(html).toContain("Custom option"); expect(html).toContain("৳ 30,000 – 50,000 / month");
  expect(html).not.toContain("/fixture.svg"); expect(html).toContain("9 Oct 2026");
  expect(html).toContain("Row menu: Edit · Duplicate · Close / Reopen");
  expect(mocks.gate).toHaveBeenCalled();
});

it("distinguishes genuine empties from filtered misses and supplies working clear/create actions", async () => {
  const empty = renderToStaticMarkup(await JobsPage({ searchParams: Promise.resolve({}) }));
  expect(empty).toContain("No jobs yet"); expect(empty).toContain('href="/admin/jobs/new"');
  expect(empty).not.toContain("Clear filters");
  const filtered = renderToStaticMarkup(await JobsPage({ searchParams: Promise.resolve({ q: "none" }) }));
  expect(filtered).toContain("No jobs match these filters."); expect(filtered).toContain("Clear filters");
  expect(filtered).toContain('href="/admin/jobs/new"');
});
