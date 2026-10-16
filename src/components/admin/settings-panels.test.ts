import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/admin/(protected)/departments/actions", () => ({ saveDepartmentAction: vi.fn(), reorderDepartmentAction: vi.fn() }));
vi.mock("@/app/admin/(protected)/options/actions", () => ({ saveOptionAction: vi.fn(), reorderOptionAction: vi.fn(), deleteOptionAction: vi.fn() }));
vi.mock("@/db/queries/departments", () => ({ listDepartments: vi.fn(async () => []), departmentJobCounts: vi.fn(async () => []) }));
vi.mock("@/db/queries/job-options", () => ({ listJobOptions: vi.fn(async () => []), optionLinkCounts: vi.fn(async () => new Map()) }));
import { SettingsPanels } from "./settings-panels";
import { listDepartments, departmentJobCounts } from "@/db/queries/departments";
import { listJobOptions, optionLinkCounts } from "@/db/queries/job-options";

it("composes both surfaces under the drawn title with groups before Create option and complete empty states", async () => {
  const html = renderToStaticMarkup(await SettingsPanels());
  expect(html).toContain("Departments &amp; options"); expect(html).toContain('class="admin-grid admin-settings-combined"');
  expect(html).toContain("No departments yet."); expect([...html.matchAll(/No options in this group yet/g)]).toHaveLength(3);
  expect(html.indexOf('aria-label="Departments"')).toBeLessThan(html.indexOf('aria-label="Work arrangement"'));
  expect(html.indexOf('aria-label="Experience"')).toBeLessThan(html.indexOf('aria-label="Option editor"'));
  for (const query of [listDepartments, departmentJobCounts, listJobOptions, optionLinkCounts]) expect(query).toHaveBeenCalledOnce();
});
