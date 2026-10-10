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
it("renders an independent form page from fresh definitions without inline anchors or cached JobPage", async () => {
  const question = { id: "fresh", label: "Fresh question" };
  mocks.current.mockResolvedValue({ ...cached, job: { ...job, cvRequired: false }, questions: [question] });
  const html = renderToStaticMarkup(await ApplyPage({ params: params() }));
  expect(html).toContain("Apply for Web Developer"); expect(html).toContain("Back to job");
  expect(html).toContain("<form"); expect(html).not.toContain('id="apply"'); expect(html).not.toContain('href="#apply"');
  expect(mocks.cached).not.toHaveBeenCalled();
  expect(mocks.form.mock.calls[0][0]).toMatchObject({ jobSlug: job.slug, questions: [question], cvRequired: false });
});
it("marks the independent route noindex while keeping the canonical job metadata", async () => {
  const metadata = await generateMetadata({ params: params() });
  expect(metadata.robots).toEqual({ index: false, follow: false });
  expect(metadata.alternates?.canonical).toBe("https://careers.example.test/jobs/web-developer");
});
it("rejects unsafe slugs before reads", async () => {
  await expect(ApplyPage({ params: Promise.resolve({ slug: "../private" }) })).rejects.toThrow("not-found");
  expect(mocks.current).not.toHaveBeenCalled();
});
it.each(["closed", "expired"])("shows a friendly %s notice without a form", async kind => {
  mocks.current.mockResolvedValue({ ...cached, job: { ...job, status: kind === "closed" ? "closed" : "open", deadlineAt: kind === "expired" ? new Date("2000-01-01") : null } });
  const html = renderToStaticMarkup(await ApplyPage({ params: params() }));
  expect(html).toContain("No longer accepting applications"); expect(html).toContain("Read the job details"); expect(mocks.form).not.toHaveBeenCalled();
});
it.each(["draft", "hidden", "missing"])("returns 404 for a current %s role", async kind => {
  mocks.current.mockResolvedValue(kind === "missing" ? null : { ...cached, job: { ...job, status: kind === "draft" ? "draft" : "open" }, brands: [{ brand: { ...brand, status: kind === "hidden" ? "hidden" : "active" } }] });
  await expect(ApplyPage({ params: params() })).rejects.toThrow("not-found"); expect(mocks.form).not.toHaveBeenCalled();
});
it("hides provider diagnostics", async () => {
  mocks.current.mockRejectedValue(new Error("Sensitive provider diagnostic"));
  await expect(ApplyPage({ params: params() })).rejects.toThrow("Unable to load the application form.");
});
