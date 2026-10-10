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
it("renders sanitized job content and two real Apply links without form or Turnstile", async () => {
  const html = renderToStaticMarkup(await JobPage({ params: params() }));
  expect(html).not.toContain('id="apply"'); expect(html).not.toContain('href="#apply"');
  expect(html.match(/href="\/jobs\/web-developer\/apply"/g)).toHaveLength(2);
  expect(html).not.toContain("<form"); expect(html).not.toContain("turnstile");
  expect(html).toContain("<strong>Meaningful work</strong>"); expect(html).not.toContain("<script");
  expect(html).toContain("Job summary"); expect(html).toContain("Negotiable");
  expect(mocks.form).not.toHaveBeenCalled();
});
it.each(["closed", "expired"])("shows current %s state without a form or apply anchors, even with an open cached role", async (kind) => {
  mocks.current.mockResolvedValue({ ...cached, job: { ...job, status: kind === "closed" ? "closed" : "open", deadlineAt: kind === "expired" ? new Date("2000-01-01") : null } });
  const html = renderToStaticMarkup(await JobPage({ params: params() }));
  expect(html).toContain("No longer accepting applications");
  expect(html).not.toContain('id="apply"'); expect(mocks.form).not.toHaveBeenCalled();
  expect(html).not.toContain('href="/jobs/web-developer/apply"');
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
  await expect(JobPage({ params: params() })).rejects.toThrow("Unable to load this role.");
});
it("retains public canonical metadata without applicant data", async () => {
  expect(await generateMetadata({ params: params() })).toMatchObject({ title: "Web Developer · Careers", alternates: { canonical: "https://careers.example.test/jobs/web-developer" } });
});
it("omits unset optional sections/rows and preserves configured experience/options/benefits", async () => {
  const empty = renderToStaticMarkup(await JobPage({ params: params() }));
  expect(empty).not.toContain("What keeps you ahead"); expect(empty).not.toContain("Skills and areas of expertise");
  expect(empty).not.toContain("Compensation &amp; benefits"); expect(empty).not.toContain(">Vacancy<");
  const extended = { ...job, salaryMode: "range", salaryText: "৳ 20,000 – 30,000", vacancies: 2, experienceText: "1 – 2 years", engagementNote: "Six months", skills: ["React"], benefits: ["Flexible hours"], niceToHaveMd: "- Bengali communication", responsibilitiesMd: "- Build interfaces\n- Review code" };
  mocks.cached.mockResolvedValue({ ...cached, job: extended, options: [...optionTags, { group: "experience", slug: "custom", label: "Custom exact label" }] });
  const html = renderToStaticMarkup(await JobPage({ params: params() }));
  for (const value of [extended.salaryText, "1 – 2 years · Custom exact label", "Full-time · Six months", "Flexible hours", "Bengali communication", "<ul>"]) expect(html).toContain(value);
  expect(html).not.toContain("Negotiable");
});
