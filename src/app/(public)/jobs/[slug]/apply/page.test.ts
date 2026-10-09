import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cached: vi.fn(), current: vi.fn(), form: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db/queries/public-jobs", () => ({ loadPublicJob: mocks.cached, loadApplicationJob: mocks.current }));
vi.mock("@/lib/env-public", () => ({ getPublicEnv: () => ({ NEXT_PUBLIC_SITE_URL: "https://careers.example.test" }) }));
vi.mock("@/components/public/application-form", () => ({ ApplicationForm: mocks.form }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("not-found"); } }));
import ApplyPage, { generateMetadata } from "./page";

const job = { id: "synthetic-job", slug: "web-developer", title: "Web Developer", status: "open", summary: "A thoughtful role", locationText: "Dhaka", engagementNote: null, salaryMode: "negotiable", salaryText: null, vacancies: null, experienceText: null, skills: [], benefits: [], niceToHaveMd: "", cvRequired: true, deadlineAt: null, descriptionMd: "Body", responsibilitiesMd: "Build", requirementsMd: "Learn" };
const brand = { id: "brand", name: "Brand", slug: "brand", status: "active", logoUrl: null };
const cached = { job, department: { name: "Technical", slug: "technical" }, brands: [{ brand, primary: true }], questions: [], options: [] };
const params = () => Promise.resolve({ slug: job.slug });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.cached.mockResolvedValue(cached);
  mocks.current.mockResolvedValue(cached);
  mocks.form.mockImplementation(() => createElement("form", null, "Synthetic application form"));
});
it("renders the same inline job page instead of redirecting", async () => {
  const html = renderToStaticMarkup(await ApplyPage({ params: params() }));
  expect(html).toContain("Web Developer");
  expect(html).toContain('id="apply"');
});
it("marks the legacy route noindex while keeping the canonical job metadata", async () => {
  const metadata = await generateMetadata({ params: params() });
  expect(metadata.robots).toEqual({ index: false, follow: false });
  expect(metadata.alternates?.canonical).toBe("https://careers.example.test/jobs/web-developer");
});
it("rejects unsafe slugs with the shared page's 404", async () => {
  await expect(ApplyPage({ params: Promise.resolve({ slug: "../private" }) })).rejects.toThrow("not-found");
});
