import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/admin/(protected)/departments/actions", () => ({ saveDepartmentAction: vi.fn(), reorderDepartmentAction: vi.fn() }));
vi.mock("@/app/admin/(protected)/options/actions", () => ({ saveOptionAction: vi.fn(), reorderOptionAction: vi.fn(), deleteOptionAction: vi.fn() }));
import { DepartmentManager } from "./department-manager";
import { OptionsManager } from "./options-manager";

it("renders departments with actual counts, inactive state, compact add and disclosed slug/active controls", () => {
  const id = "00000000-0000-4000-8000-000000000001";
  const html = renderToStaticMarkup(createElement(DepartmentManager, { rows: [{ id, name: "বাংলা department", slug: "sample", sortOrder: 0, isActive: false, createdAt: new Date(0) }], counts: { [id]: 7 } }));
  expect(html).toContain("বাংলা department"); expect(html).toContain("Inactive"); expect(html).toContain('Roles: </span>7');
  expect(html).toContain('placeholder="New department"'); expect(html).toContain('aria-label="Add department"');
  expect(html).toContain("Additional settings"); expect(html).toContain('pattern="[a-z0-9]+(-[a-z0-9]+)*"');
  for (const direction of ["up", "down"]) expect(html).toContain(`disabled="" aria-label="Move বাংলা department ${direction}"`);
});
it("retains verbatim option labels/counts, linked deletion guidance, within-group boundaries and native delete confirmation", () => {
  const id = "00000000-0000-4000-8000-000000000001";
  const rows = [{ id, group: "arrangement" as const, label: "Exact option", slug: "exact-option", sortOrder: 0, isActive: true }];
  const html = renderToStaticMarkup(createElement(OptionsManager, { rows, counts: { [id]: 3 } }));
  expect(html).toContain("Exact option"); expect(html).toContain('Jobs: </span>3');
  expect(html).toContain('disabled="" title="Used by jobs"'); expect(html).toContain("Deactivate instead of deleting.");
  expect(html).toContain('aria-label="Delete option"'); expect(html).toContain("permanently removes an unused option");
  for (const direction of ["up", "down"]) expect(html).toContain(`disabled="" aria-label="Move Exact option ${direction}"`);
  expect(html).toContain("Labels are shown exactly as typed."); expect(html).toContain("Slugs are used in filter URLs.");
  expect(html).toContain('class="admin-option-fields"'); expect(html).toContain(">Create</button>");
});
it("does not disable deleting an unlinked option and keeps Activate for inactive options", () => {
  const html = renderToStaticMarkup(createElement(OptionsManager, { rows: [{ id: "00000000-0000-4000-8000-000000000001", group: "experience", label: "Unused", slug: "unused", sortOrder: 0, isActive: false }], counts: {} }));
  expect(html).toContain("Activate"); expect(html).not.toContain('disabled="" title="Used by jobs"');
  expect(html).toContain('aria-label="Delete Unused"');
});
