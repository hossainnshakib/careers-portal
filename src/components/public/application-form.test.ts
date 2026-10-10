import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import type { QuestionDefinition } from "@/lib/questions/definition";
import { QuestionFields } from "@/components/form-renderer/question-fields";

vi.mock("@/app/(public)/jobs/[slug]/apply/actions", () => ({ submitApplication: vi.fn() }));
import { ApplicationForm } from "./application-form";

const question = (type: QuestionDefinition["type"], index = 1): QuestionDefinition => ({
  id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`, type, label: `Configured ${type}`,
  helpText: "সৃজনশীল উত্তর দিন", required: true, section: "role_specific", sortOrder: index,
  options: type.endsWith("choice") ? [{ value: "actual-value", label: "Actual label" }] : null,
  config: type.endsWith("choice") ? { allowOther: true } : type === "file_upload" ? { accept: ["pdf", "png"], maxSizeMb: 3 } : null,
});

it("renders all eleven configured types, fixed contacts and genuine upload limits without eager Turnstile", () => {
  const types: QuestionDefinition["type"][] = ["short_text", "long_text", "single_choice", "multiple_choice", "yes_no", "number", "url", "email", "phone", "file_upload", "date"];
  const html = renderToStaticMarkup(createElement(ApplicationForm, { jobSlug: "synthetic-role", questions: types.map((type, index) => question(type, index + 1)), cvRequired: true }));
  for (const type of types) expect(html).toContain(`Configured ${type}`);
  expect(html.match(/aria-label="Full name"/g)).toHaveLength(1);
  for (const inputType of ["email", "tel", "number", "url", "date", "file"]) expect(html).toContain(`type="${inputType}"`);
  expect(html).toContain('accept=".pdf,.doc,.docx"');
  expect(html).toContain('accept=".pdf,.png"'); expect(html).toContain("up to 3 MB");
  expect(html).toContain("Up to 8 files per application");
  expect(html).toContain("সৃজনশীল উত্তর দিন");
  expect(html).toContain('href="/privacy"'); expect(html).toContain('name="consent"');
  expect(html).toContain('type="submit" disabled=""');
  expect(html).not.toContain("UTC calendar"); expect(html).not.toContain("challenges.cloudflare.com");
});

it("honours optional CV policy and renders a distinct privacy consent control", () => {
  const html = renderToStaticMarkup(createElement(ApplicationForm, { jobSlug: "synthetic-role", questions: [], cvRequired: false }));
  expect(html).toContain('aria-label="CV (optional)"');
  expect(html).not.toContain('aria-label="CV *"');
  expect(html).toContain("consent to my application being processed for this role");
  expect(html.match(/name="consent"/g)).toHaveLength(1);
});

it("keeps selected Other values, boolean false and linked help/error text accessible", () => {
  const q = question("single_choice");
  const html = renderToStaticMarkup(createElement(QuestionFields, { question: q, value: "other:synthetic", other: "অন্য দক্ষতা", onChange: () => {}, onOtherChange: () => {}, error: "Please complete this answer." }));
  expect(html).toContain("অন্য দক্ষতা"); expect(html).toContain("Other answer");
  expect(html).toContain('data-selected="true"'); expect(html).toContain('aria-invalid="true"');
  expect(html).toContain(`question-help-${q.id}`); expect(html).toContain(`question-error-${q.id}`);
  const boolean = renderToStaticMarkup(createElement(QuestionFields, { question: question("yes_no"), value: false, other: "", onChange: () => {}, onOtherChange: () => {} }));
  expect(boolean).toContain('<option value="no" selected="">No</option>');
});
