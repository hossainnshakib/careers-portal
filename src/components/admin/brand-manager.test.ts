import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import type { Brand } from "@/db/schema";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/admin/(protected)/brands/actions", () => ({ reorderBrandAction: vi.fn(), saveBrandAction: vi.fn(), uploadBrandLogoAction: vi.fn() }));
import { BrandManager } from "./brand-manager";
import { contrastRatio, readableAccentText } from "@/lib/brands/contrast";

const brand: Brand = { id: "00000000-0000-4000-8000-000000000001", name: "Synthetic brand", slug: "synthetic-brand", sector: "media", logoUrl: "/brands/fixen-media.svg", description: "", website: null, accentColor: "#EC1C24", status: "active", sortOrder: 0, createdAt: new Date(0) };
it("renders a real semantic card list with accent initials, statuses and disclosed boundary-safe actions", () => {
  const html = renderToStaticMarkup(createElement(BrandManager, { rows: [brand] }));
  expect(html).toContain('<ul aria-label="Brands in display order"');
  expect(html).toContain('<article aria-label="Synthetic brand" data-selected="true"');
  expect(html).not.toContain('role="table"'); expect(html).not.toContain('role="cell"');
  const card = html.slice(html.indexOf("<article"), html.indexOf("</article>"));
  expect(card).toContain("/synthetic-brand · Media"); expect(card).toContain("No description");
  expect(card).not.toContain("<img"); expect(card).toContain('aria-pressed="true"');
  expect(card).toContain('disabled="" aria-label="Move Synthetic brand up"');
  expect(card).toContain('disabled="" aria-label="Move Synthetic brand down"');
});
it("shows a persisted passive logo plus compact name/description and every extra field without reducing the description bound", () => {
  const html = renderToStaticMarkup(createElement(BrandManager, { rows: [brand] }));
  expect(html).toContain('alt="Synthetic brand logo"'); expect(html).toContain("SVG, PNG or WebP");
  expect(html).toContain("Description (0/3000)"); expect(html).toContain('maxLength="3000"');
  const settings = html.slice(html.indexOf('class="admin-brand-settings"'), html.indexOf("</details>", html.indexOf('class="admin-brand-settings"')));
  for (const label of ["Slug", "Sector", "Website", "Accent color", "Status"]) expect(settings).toContain(label);
  expect(html).toContain("Sample text on accent"); expect(html).toContain("New brand");
  expect(contrastRatio("#EC1C24", "#ffffff")).toBeLessThan(4.5);
  expect(contrastRatio("#EC1C24", readableAccentText("#EC1C24"))).toBeGreaterThanOrEqual(4.5);
});
it("keeps empty-create state and disabled pre-save logo upload without inventing an order field", () => {
  const html = renderToStaticMarkup(createElement(BrandManager, { rows: [] }));
  expect(html).toContain("No brands yet."); expect(html).toContain("Create brand");
  expect(html).toContain("Save the brand first"); expect(html).toContain('disabled="">Upload logo');
});
