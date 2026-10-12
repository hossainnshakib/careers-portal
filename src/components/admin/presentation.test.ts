import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { contrastRatio } from "@/lib/brands/contrast";
import { BrandMark } from "./brand-mark";
import { ApplicationTable } from "./application-table";
import { ApplicationEmptyState } from "./application-table";

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

it("matches reference glass density without nested blur and supplies opaque fallbacks", () => {
  const css = readFileSync("src/app/admin/admin.css", "utf8");
  expect(css).toContain("--admin-glass: rgba(255, 255, 255, 0.58)");
  expect(css).toContain("--admin-glass-strong: rgba(255, 255, 255, 0.76)");
  expect(css).toMatch(/\.admin-card\s*\{\s*background: var\(--admin-glass-strong\);\s*-webkit-backdrop-filter: blur\(14px\);\s*backdrop-filter: blur\(14px\)/);
  expect(css).toMatch(/\.admin-card \.admin-card,[\s\S]*?backdrop-filter: none;[\s\S]*?background: rgba\(255, 255, 255, 0\.9\)/);
  expect(css).toContain("@supports not ((backdrop-filter:");
  expect(css).toContain("@media (prefers-reduced-transparency: reduce)");
  expect(css).toMatch(/\.admin-sidebar nav\s*\{\s*display: grid;\s*gap: 4px;/);
  expect(css).toContain("line-height: normal;");
});

it("shows Applied before only for the additive earlier-email flag, never by matching candidate names", () => {
  const base = { id: "fixture", reference: "APP-234567", fullName: "Synthetic candidate", email: "fixture@example.com", status: "new" as const, submittedAt: new Date("2026-10-09T01:42:00Z"), jobTitle: "Fixture role", brandNames: ["Fixture"], department: "Fixture department" };
  const html = renderToStaticMarkup(createElement(ApplicationTable, { rows: [{ ...base, appliedBefore: true }, { ...base, id: "second", appliedBefore: false }], initialsOnly: true, brandAccents: [{ name: "Fixture", accentColor: "#123456", logoUrl: "/fixture.svg" }] }));
  expect([...html.matchAll(/>Applied before</g)]).toHaveLength(1);
  expect(html).not.toContain("fixture@example.com");
  expect(html).not.toContain("/fixture.svg");
  expect(html).toContain("admin-applied-before");
});

it("distinguishes genuinely empty applications from filtered misses without a useless reset action", () => {
  const empty = renderToStaticMarkup(createElement(ApplicationEmptyState, { unfiltered: true }));
  expect(empty).toContain("No applications yet");
  expect(empty).toContain('href="/admin/jobs/new"');
  expect(empty).not.toContain("Clear filters");
  const filtered = renderToStaticMarkup(createElement(ApplicationEmptyState));
  expect(filtered).toContain("No applications match these filters");
  expect(filtered).toContain("Try a different name or remove a filter.");
  expect(filtered).toContain("Clear filters");
});
