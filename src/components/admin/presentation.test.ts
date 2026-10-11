import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { contrastRatio } from "@/lib/brands/contrast";
import { BrandMark } from "./brand-mark";
import { ApplicationTable } from "./application-table";

vi.mock("@/app/admin/mfa/actions", () => ({ enrollMfaAction: vi.fn(), verifyMfaAction: vi.fn() }));
import { MfaForm } from "./mfa-form";

it("renders six MFA cells with one unambiguous composite-code selector", () => {
  const html = renderToStaticMarkup(createElement(MfaForm, { factors: [{ id: "fixture", name: "Authenticator" }] }));
  expect([...html.matchAll(/class="admin-digit"/g)]).toHaveLength(6);
  expect([...html.matchAll(/aria-label="Authenticator code"/g)]).toHaveLength(1);
  for (let index = 2; index <= 6; index++) expect(html).toContain(`aria-label="Authenticator code digit ${index}"`);
  expect(html).toContain("Verify authenticator");
  expect(html).toContain("disabled");
});

it("keeps uploaded SVG logos passive and fallback initials readable", () => {
  const image = renderToStaticMarkup(createElement(BrandMark, { name: "Fixture", logoUrl: "/brands/fixture.svg", alt: "Fixture logo" }));
  expect(image).toContain('<img src="/brands/fixture.svg" alt="Fixture logo"');
  expect(image).not.toContain("<svg");
  const fallback = renderToStaticMarkup(createElement(BrandMark, { name: "Fixture", accentColor: "#0AA278" }));
  const ink = fallback.match(/color:([^;"<]+)/)?.[1];
  expect(ink).toBeTruthy();
  expect(contrastRatio("#0AA278", ink!)).toBeGreaterThanOrEqual(4.5);
});

it("keeps semantic table rows and historical branding neutral if ambiguous", () => {
  const html = renderToStaticMarkup(createElement(ApplicationTable, {
    rows: [{ id: "fixture", reference: "APP-234567", fullName: "শ্রী ক্ষিতিশ", email: "fixture@example.com", status: "new", submittedAt: new Date("2026-10-09T01:42:00Z"), jobTitle: "Fixture role", brandNames: ["Duplicate"], department: "Fixture department" }],
    brandAccents: [{ name: "Duplicate", accentColor: "#123456", logoUrl: "/first.svg" }, { name: "Duplicate", accentColor: "#654321", logoUrl: "/second.svg" }],
  }));
  expect(html).toContain('role="table"');
  expect([...html.matchAll(/role="row"/g)]).toHaveLength(2);
  expect(html).toContain("Applied (Dhaka)");
  expect(html).toContain("9 Oct 2026, 7:42 AM");
  expect(html).not.toContain("/first.svg");
  expect(html).not.toContain("/second.svg");
  expect(html).not.toContain("fixture@example.com");
});

it("defines every admin CSS token it references and does not style the public root", () => {
  const css = readFileSync("src/app/admin/admin.css", "utf8");
  const definitions = new Set([...css.matchAll(/(--admin-[\w-]+)\s*:/g)].map(match => match[1]));
  for (const match of css.matchAll(/var\((--admin-[\w-]+)/g)) expect(definitions.has(match[1]), match[1]).toBe(true);
  expect(css).not.toMatch(/(?:^|\n)(?:body|html|\.public-ui)\s*\{/);
});

it("keeps small-text admin status and muted tokens above 4.5:1", () => {
  const css = readFileSync("src/app/admin/admin.css", "utf8");
  const token = (name: string) => css.match(new RegExp(`--admin-${name}:\\s*([^;]+);`))![1];
  // Transparent status fills are composited on the glass/canvas base (#fafbfd).
  const background = (value: string) => {
    const rgba = value.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([.\d]+)\)/);
    if (!rgba) return value;
    const alpha = Number(rgba[4]);
    return `#${[250, 251, 253].map((base, index) => Math.round(Number(rgba[index + 1]) * alpha + base * (1 - alpha)).toString(16).padStart(2, "0")).join("")}`;
  };
  for (const [foreground, fill] of [
    ["muted", "canvas"], ["blue-text", "pill-new"],
    ["pill-review-text", "pill-review"], ["pill-shortlist-text", "pill-shortlist"],
    ["pill-hired-text", "pill-hired"], ["pill-rejected-text", "pill-rejected"],
  ]) expect(contrastRatio(token(foreground), background(token(fill))), foreground).toBeGreaterThanOrEqual(4.5);
});
