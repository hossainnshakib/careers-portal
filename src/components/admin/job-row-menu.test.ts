import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

vi.mock("@/app/admin/(protected)/jobs/actions", () => ({ jobCommandAction: vi.fn() }));
import { JobRowMenu } from "./job-row-menu";

it.each(["draft", "open", "closed"] as const)("renders an escaped, destructive confirmation for %s jobs", (status) => {
  const render = (applicationCount: number) => renderToStaticMarkup(createElement(JobRowMenu, {
    id: "10000000-0000-4000-8000-000000000001",
    title: "Synthetic <role>", status, applicationCount,
  }));
  const empty = render(0);
  expect(empty).toContain('aria-label="Confirm job deletion"');
  expect(empty).toContain("Synthetic &lt;role&gt;");
  expect(empty).toContain("This cannot be undone.");
  expect(empty).toContain('class="admin-btn admin-btn-danger"');
  // The disclosure starts closed; its interactive eligibility is covered by E2E.
  expect(empty).not.toContain('aria-expanded="true"');
});
