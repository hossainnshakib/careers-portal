import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { BrandLogoRow, type LogoRowBrand } from "./brand-logo-row";

const brands = (count: number): LogoRowBrand[] =>
  Array.from({ length: count }, (_, index) => ({ id: `b${index}`, name: `Brand ${index}`, slug: `brand-${index}`, logoUrl: `/brands/brand-${index}.svg` }));

const altCount = (html: string) => (html.match(/alt="/g) ?? []).length;

it("keeps one nowrap row and shows three logos plus a +N chip for larger sets", () => {
  const html = renderToStaticMarkup(createElement(BrandLogoRow, { brands: brands(4), size: 28 }));
  expect(html).toContain('data-testid="brand-logo-row"');
  expect(html).toContain("flex-nowrap");
  expect(html).toContain("height:28px");
  // Logo boxes shrink inside the row instead of stacking.
  expect(html).toContain("min-w-0");
  expect(html).toContain("max-w-full");
  expect(html).toContain("w-auto");
  expect(altCount(html)).toBe(3);
  expect(html).toContain("+1");
  // Hidden brands stay reachable through accessible text and the tooltip.
  expect(html).toContain("more brands: Brand 3");
  expect(html).toContain('title="Brand 3"');
});

it("shows every brand without an overflow chip when three or fewer are hiring", () => {
  const two = renderToStaticMarkup(createElement(BrandLogoRow, { brands: brands(2), size: 28 }));
  expect(altCount(two)).toBe(2);
  expect(two).not.toContain("+1");
  expect(two).not.toContain("more brands");
  const three = renderToStaticMarkup(createElement(BrandLogoRow, { brands: brands(3), size: 28 }));
  expect(altCount(three)).toBe(3);
  expect(three).not.toContain("+");
});

it("uses taller hero chips with a labelled group and tolerates missing logos", () => {
  const html = renderToStaticMarkup(createElement(BrandLogoRow, { brands: [{ id: "x", name: "No Logo", slug: "no-logo", logoUrl: null }, ...brands(1)], size: 30, chip: true, ariaLabel: "Hiring brands" }));
  expect(html).toContain('role="group"');
  expect(html).toContain('aria-label="Hiring brands"');
  // 30px logo + 3px padding on each side.
  expect(html).toContain("height:36px");
  expect(altCount(html)).toBe(1);
  expect(html).toContain("Brand 0 logo");
});
