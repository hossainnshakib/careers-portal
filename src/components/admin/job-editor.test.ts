import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

vi.mock("@/app/admin/(protected)/jobs/actions", () => ({ saveJobAction: vi.fn(), jobCommandAction: vi.fn() }));
import { JobEditor, type JobEditorProps } from "./job-editor";

const initial: JobEditorProps["initial"] = {
  id: "00000000-0000-4000-8000-000000000001", title: "Synthetic role", slug: "synthetic-role",
  departmentId: "00000000-0000-4000-8000-000000000002", brandIds: [], primaryBrandId: "", optionIds: [],
  engagementNote: null, salaryMode: "negotiable", salaryText: "", vacancies: null, experienceText: null,
  skills: [], benefits: [], niceToHaveMd: "", locationText: "", deadlineAt: null, cvRequired: true,
  summary: "", descriptionMd: "", responsibilitiesMd: "", requirementsMd: "", questions: [], intent: "save",
};

it.each([
  [false, "draft", false, true],
  [false, "draft", true, false],
  [true, "closed", true, false],
] as const)("keeps job commands for published=%s, status=%s, applications=%s", (published, status, hasApplications, canDelete) => {
  const html = renderToStaticMarkup(createElement(JobEditor, {
    initial, brands: [], departments: [], sources: [], options: [], published, status, hasApplications,
  }));
  expect(html).toContain("Save changes");
  expect(html).toContain("Publish job");
  expect(html.includes("Delete draft")).toBe(canDelete);
  expect(html.includes("Reopen job")).toBe(status === "closed");
});

it.each([
  ["negotiable", "", 0],
  ["range", "৳ 20,000 – 30,000", 1],
  ["negotiable", "Stale ignored text", 0],
  // Regression: a stored range row with blank text must still select range and show the field.
  // The DB CHECK constraint now prevents this state for new saves; existing rows need the editor fix.
  ["range", "", 1],
] as const)("initial stored mode %s selects the correct radio and controls salary text", (salaryMode, salaryText, selectedIndex) => {
  const html = renderToStaticMarkup(createElement(JobEditor, {
    initial: { ...initial, salaryMode, salaryText }, brands: [], departments: [], sources: [], options: [],
    published: true, status: "open", hasApplications: false,
  }));
  const radios = [...html.matchAll(/<input\b[^>]*name="salaryMode"[^>]*>/g)].map(match => match[0]);
  expect(radios).toHaveLength(2);
  expect(radios.filter(radio => radio.includes('checked=""'))).toHaveLength(1);
  expect(radios[selectedIndex]).toContain('checked=""');
  expect(radios[1 - selectedIndex]).not.toContain('checked=""');
  if (salaryMode === "range") {
    expect(html).toContain('aria-label="Salary range"');
    if (salaryText) expect(html).toContain(salaryText);
  } else {
    expect(html).not.toContain('aria-label="Salary range"'); expect(html).not.toContain("Stale ignored text");
  }
});
