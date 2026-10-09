import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cached: vi.fn(), current: vi.fn(), form: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db/queries/public-jobs", () => ({ loadPublicJob: mocks.cached, loadApplicationJob: mocks.current }));
vi.mock("@/lib/env-public", () => ({ getPublicEnv: () => ({ NEXT_PUBLIC_SITE_URL: "https://careers.example.test" }) }));
vi.mock("@/components/public/application-form", () => ({ ApplicationForm: mocks.form }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("not-found"); } }));
import JobPage, { generateMetadata } from "./page";

const job = { id: "synthetic-job", slug: "web-developer", title: "Web Developer", status: "open", summary: "A thoughtful role", locationText: "Dhaka", engagementNote: null, salaryMode: "negotiable", salaryText: null, vacancies: null, experienceText: null, skills: [], benefits: [], niceToHaveMd: "", cvRequired: true, deadlineAt: null, descriptionMd: "**Meaningful work**\n\n<script>unsafe()</script>", responsibilitiesMd: "Build", requirementsMd: "Learn" };
const brand = { id: "brand", name: "Brand", slug: "brand", status: "active", logoUrl: null };
const optionTags = [{ group: "arrangement", slug: "remote", label: "Work from home" }, { group: "engagement", slug: "full_time", label: "Full-time" }];
const cached = { job, department: { name: "Technical", slug: "technical" }, brands: [{ brand, primary: true }], questions: [], options: optionTags };
const freshQuestion = { id: "00000000-0000-4000-8000-000000000001", label: "Fresh question", type: "long_text", required: true, section: "professional", options: null, config: null, helpText: null, sortOrder: 0 };
const params = () => Promise.resolve({ slug: job.slug });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.cached.mockResolvedValue(cached);
  mocks.current.mockResolvedValue({ ...cached, job: { ...job, cvRequired: false }, questions: [freshQuestion] });
  mocks.form.mockImplementation(() => createElement("form", null, "Synthetic application form"));
});
it("composes the form into the role using current questions/CV policy, with sanitized content", async () => {
  const html = renderToStaticMarkup(await JobPage({ params: params() }));
  expect(html).toContain('id="apply"'); expect(html).toContain('href="#apply"');
  expect(html).toContain("<strong>Meaningful work</strong>"); expect(html).not.toContain("<script");
  expect(mocks.form.mock.calls[0][0]).toMatchObject({ jobSlug: job.slug, questions: [freshQuestion], cvRequired: false });
});
it.each(["closed", "expired"])("shows current %s state without a form or apply anchors, even with an open cached role", async (kind) => {
  mocks.current.mockResolvedValue({ ...cached, job: { ...job, status: kind === "closed" ? "closed" : "open", deadlineAt: kind === "expired" ? new Date("2000-01-01") : null } });
  const html = renderToStaticMarkup(await JobPage({ params: params() }));
  expect(html).toContain("No longer accepting applications");
  expect(html).not.toContain('id="apply"'); expect(mocks.form).not.toHaveBeenCalled();
});
it.each(["draft", "hidden", "missing"])("returns 404 for a current %s role", async (kind) => {
  mocks.current.mockResolvedValue(kind === "missing" ? null : { ...cached, job: { ...job, status: kind === "draft" ? "draft" : "open" }, brands: [{ brand: { ...brand, status: kind === "hidden" ? "hidden" : "active" } }] });
  await expect(JobPage({ params: params() })).rejects.toThrow("not-found");
  expect(mocks.form).not.toHaveBeenCalled();
});
it("rejects invalid slugs before database reads and hides provider diagnostics", async () => {
  await expect(JobPage({ params: Promise.resolve({ slug: "../private" }) })).rejects.toThrow("not-found");
  expect(mocks.cached).not.toHaveBeenCalled();
  mocks.current.mockRejectedValue(new Error("Sensitive provider diagnostic"));
  await expect(JobPage({ params: params() })).rejects.toThrow("Unable to load the application form.");
});
it("retains public canonical metadata without applicant data", async () => {
  expect(await generateMetadata({ params: params() })).toMatchObject({ title: "Web Developer · Careers", alternates: { canonical: "https://careers.example.test/jobs/web-developer" } });
});
