import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ gate: vi.fn(), rows: vi.fn(), options: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/requireAdmin", () => ({ requireAdmin: mocks.gate }));
vi.mock("@/lib/auth/page-denial", () => ({ redirectAdminDenial: () => { throw new Error("login redirect"); } }));
vi.mock("@/db/queries/review", () => ({ listReviewApplications: mocks.rows, reviewFilterOptions: mocks.options, reviewPageSize: 25 }));
vi.mock("./actions", () => ({ addNoteAction: vi.fn(), changeStatusAction: vi.fn(), deleteApplicationAction: vi.fn(), deleteNoteAction: vi.fn() }));
import ApplicationsPage from "./page";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.gate.mockResolvedValue({ userId: "isolated-unit-admin" });
  mocks.rows.mockResolvedValue({ rows: [], total: 0, page: 1, pages: 1 });
  mocks.options.mockResolvedValue({ brands: [], departments: [], jobs: [] });
});

it("renders the authenticated empty page without synthetic applicants, stale links or invented counts", async () => {
  const html = renderToStaticMarkup(await ApplicationsPage({ searchParams: Promise.resolve({}) }));
  expect(mocks.gate).toHaveBeenCalledOnce();
  expect(html).toContain("No applications yet");
  expect(html).toContain("Applications will appear here when candidates apply.");
  expect(html).toContain("0 results");
  expect(html).toContain('href="/admin/jobs/new"');
  expect(html).not.toMatch(/DEMO|Synthetic Candidate|APP-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}/);
  expect(html).not.toContain("Download CV");
  expect(html).not.toMatch(/href="\/admin\/applications\/[a-f0-9-]+"/);
});

it("keeps filtered misses distinct from a genuine empty dataset", async () => {
  const html = renderToStaticMarkup(await ApplicationsPage({ searchParams: Promise.resolve({ q: "no-match" }) }));
  expect(html).toContain("No applications match these filters");
  expect(html).not.toContain("No applications yet");
  expect(html).toContain("Clear filters");
  expect(html).toContain('href="/admin/applications"');
  expect(mocks.rows).toHaveBeenCalledWith(expect.objectContaining({ q: "no-match" }));
});

it("does not load private query data before independent authorization", async () => {
  mocks.gate.mockRejectedValue(new Error("denied"));
  await expect(ApplicationsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("login redirect");
  expect(mocks.rows).not.toHaveBeenCalled();
  expect(mocks.options).not.toHaveBeenCalled();
});

it("does not replace read failures with fabricated empty data or leak provider errors", async () => {
  mocks.rows.mockRejectedValue(new Error("private-provider-marker"));
  await expect(ApplicationsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("Unable to load applications.");
});
