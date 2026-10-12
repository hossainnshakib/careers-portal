import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

vi.mock("@/app/admin/(protected)/jobs/actions", () => ({ saveJobAction: vi.fn(), jobCommandAction: vi.fn() }));
import { JobEditor, type JobEditorProps } from "./job-editor";
import { publishBlockers } from "@/lib/admin/job-publish";

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
  expect(html).toContain(status === "draft" ? "Save draft" : "Save changes");
  expect(html).toContain('aria-label="Publish job"');
  expect(html.includes("Delete draft")).toBe(canDelete);
  expect(html.includes("Reopen job")).toBe(status === "closed");
  expect(html).toContain('aria-label="More job actions"');
  expect(html).toContain('aria-label="Confirm job publication"');
  expect(html).toContain("The slug locks after publishing.");
  expect(html).toContain("/jobs/synthetic-role");
});

it("reports actual missing publish groups and field blockers, and marks only a valid selected draft ready", () => {
  const brand = "00000000-0000-4000-8000-000000000003";
  const arrangement = "00000000-0000-4000-8000-000000000004";
  const engagement = "00000000-0000-4000-8000-000000000005";
  const options = [{ id: arrangement, group: "arrangement" as const }, { id: engagement, group: "engagement" as const }];
  const valid = { ...initial, brandIds: [brand], primaryBrandId: brand, optionIds: [arrangement, engagement] };
  expect(publishBlockers(valid, options)).toEqual([]);
  expect(publishBlockers({ ...valid, optionIds: [arrangement] }, options)).toEqual(["Select at least one engagement type."]);
  expect(publishBlockers({ ...valid, title: "", salaryMode: "range", salaryText: "" }, options).join(" ")).toMatch(/title.*salaryText/);
  expect(publishBlockers({ ...valid, primaryBrandId: "00000000-0000-4000-8000-000000000006" }, options).join(" ")).toContain("one primary");
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

it("matches compact Basics labels and keeps every extra field and linked inactive option editable", () => {
  const selected = "00000000-0000-4000-8000-000000000004";
  const hidden = "00000000-0000-4000-8000-000000000005";
  const html = renderToStaticMarkup(createElement(JobEditor, {
    initial: { ...initial, optionIds: [selected], engagementNote: "Six months", experienceText: "1 – 4 years" },
    brands: [], departments: [], sources: [], published: true, status: "open", hasApplications: false,
    options: [{ id: selected, group: "arrangement", label: "Inactive linked option", slug: "linked", isActive: false }, { id: hidden, group: "arrangement", label: "Inactive unlinked option", slug: "unlinked", isActive: false }],
  }));
  const basics = html.slice(html.indexOf('aria-labelledby="job-basics"'), html.indexOf('aria-labelledby="job-content"'));
  expect(basics).toContain("Inactive linked option"); expect(basics).not.toContain("Inactive unlinked option");
  expect(basics).toContain('<legend>Brands</legend>'); expect(basics).toContain('<legend>Work arrangement</legend>');
  expect(basics).not.toContain("select at least one to publish)");
  expect(basics).toContain('class="admin-basics-extra"><summary>Additional settings</summary>');
  expect(basics).toContain('aria-label="Experience text"'); expect(basics).toContain('value="1 – 4 years"');
  expect(basics).toContain('aria-label="Engagement note"'); expect(basics).toContain('value="Six months"');
  expect(basics).toContain('aria-label="Deadline" type="date"'); expect(basics).toContain('aria-label="Deadline time" type="time"');
  expect(basics).toContain('readOnly=""');
});

it("matches Content order, inline summary counter, four independent toggles and list input limits", () => {
  const html = renderToStaticMarkup(createElement(JobEditor, { initial: { ...initial, summary: "Hello", benefits: ["Festival bonus"], skills: ["React"] }, brands: [], departments: [], sources: [], options: [], published: false, status: "draft", hasApplications: false }));
  const content = html.slice(html.indexOf('aria-labelledby="job-content"'), html.indexOf('aria-label="Question builder"'));
  expect(content).toContain("Summary (5/200)"); expect(content).toContain('rows="2"');
  expect([...content.matchAll(/aria-pressed="false">Preview/g)]).toHaveLength(4);
  expect(content.indexOf('data-list-kind="Benefits"')).toBeLessThan(content.indexOf('data-list-kind="Skills"'));
  expect(content).toContain('aria-label="Benefits" maxLength="60"'); expect(content).toContain('aria-label="Skills" maxLength="40"');
  expect(content).toContain('aria-label="Remove Festival bonus"'); expect(content).toContain('aria-label="Remove React"');
});
