import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { AdminShell } from "./admin-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/jobs/new" }));
vi.mock("./logout-button", () => ({ LogoutButton: () => createElement("button", {}, "Sign out") }));

it("keeps all destinations, exposes the active location and links the slide-over trigger", () => {
  const props = { email: "fixture@example.com", children: "Fixture content" };
  const html = renderToStaticMarkup(createElement(AdminShell, props));
  for (const destination of ["/admin", "/admin/applications", "/admin/jobs", "/admin/brands", "/admin/departments", "/admin/options"]) {
    expect(html).toContain(`href="${destination}"`);
  }
  expect(html).toMatch(/href="\/admin\/jobs"[^>]*aria-current="page"/);
  expect(html).toContain('aria-label="Menu" aria-expanded="false" aria-controls="admin-mobile-menu"');
  expect(html).toContain('id="main"');
  expect(html).not.toContain('role="dialog"');
  expect([...html.matchAll(/aria-hidden="true" class="admin-orb/g)]).toHaveLength(3);
});
