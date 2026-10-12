import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import DashboardPage from "@/app/admin/(protected)/page";
import { BrandMark } from "./brand-mark";

const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn(), dashboard: vi.fn(), departments: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/requireAdmin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/db/queries/review", () => ({ loadReviewDashboard: mocks.dashboard, openRolesByDepartment: mocks.departments }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({ userId: "fixture", email: "fixture@example.com" });
  mocks.dashboard.mockResolvedValue({ counts: [], latest: [], brandAccents: [] });
  mocks.departments.mockResolvedValue([]);
});

it("uses six ordered status links and explicit empty states without dropping the independent auth gate", async () => {
  const html = renderToStaticMarkup(await DashboardPage());
  expect(mocks.requireAdmin).toHaveBeenCalledOnce();
  const labels = [...html.matchAll(/class="admin-kicker is-muted">([^<]+)/g)].map((match) => match[1]);
  expect(labels).toEqual(["Total", "New", "Under review", "Shortlisted", "Rejected", "Hired"]);
  for (const status of ["new", "under_review", "shortlisted", "rejected", "hired"]) expect(html).toContain(`/admin/applications?status=${status}`);
  expect(html).toContain("No applications yet");
  expect(html).toContain("No open roles yet.");
});

it("retains all latest ten records behind responsive disclosure, uses initial marks and real role bars", async () => {
  mocks.dashboard.mockResolvedValue({
    counts: [{ status: "new", count: 10 }],
    latest: Array.from({ length: 10 }, (_, index) => ({ id: `fixture-${index}`, reference: "APP-234567", fullName: `Synthetic ${index}`, email: "fixture@example.com", status: "new", submittedAt: new Date("2026-10-09T01:42:00Z"), jobTitle: "Fixture role", brandNames: ["Fixture brand"], department: "Fixture department" })),
    brandAccents: [{ name: "Fixture brand", accentColor: "#123456", logoUrl: "/brands/fixture.svg" }],
  });
  mocks.departments.mockResolvedValue([{ departmentId: "fixture", name: "Fixture department", count: 2 }]);
  const html = renderToStaticMarkup(await DashboardPage());
  expect([...html.matchAll(/class="admin-cell-candidate"/g)]).toHaveLength(10);
  expect(html).toContain("Show all 10 latest applications");
  expect(html).toContain('aria-expanded="false"');
  expect(html).toContain("width:100%");
  expect(html).toContain("Fixture department");
  expect(html).not.toContain("/brands/fixture.svg");
  expect(html).toContain("Synthetic 9");
});

it("keeps logo rendering available while explicit initial mode matches the board", () => {
  const html = renderToStaticMarkup(createElement(BrandMark, { name: "Fixture", logoUrl: "/brands/fixture.svg", accentColor: "#123456", initialsOnly: true }));
  expect(html).not.toContain("<img");
  expect(html).toContain(">F</span>");
  expect(html).toContain("background:#123456");
});

it("fails dashboard reads with a generic message", async () => {
  mocks.dashboard.mockRejectedValueOnce(new Error("Private provider detail"));
  await expect(DashboardPage()).rejects.toThrow("Unable to load application dashboard.");
});
