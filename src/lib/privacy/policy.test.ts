import { createHash } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
// Unit rendering checks markup/content; real CSS is exercised by Playwright/Next.
vi.mock("@/app/(public)/privacy/privacy.css", () => ({}));
import PrivacyPage, { metadata } from "@/app/(public)/privacy/page";
import { PublicFooter } from "@/components/public/public-footer";
import { privacyPolicyDates, privacyPolicyIntroduction, privacyPolicySections, privacyPolicySectionsMarkdown } from "./policy";

function normalize(text: string) {
  return text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/^#+\s*/gm, "")
    .replace(/^---\s*$/gm, "").replace(/\*\*/g, "").replace(/\[([^\]]+)\]/g, "$1").replace(/\s+/g, " ").trim();
}

it("preserves the entire independently checked owner policy, with only approved contact changes", () => {
  // Independent pin computed from Prompt 20's canonical policy + owner's final
  // contact/address replacements, not generated from this implementation.
  const content = normalize(`${privacyPolicyIntroduction}\n${privacyPolicySectionsMarkdown}`);
  expect(createHash("sha256").update(content).digest("hex")).toBe("461f0fc85e084d7f30bffb39ee130f3163a23523c05a614a881a957fba1b9d03");
  expect(privacyPolicySections.map(section => section.number)).toEqual(Array.from({ length: 48 }, (_, i) => i + 1));
  expect(privacyPolicyDates).toEqual({ effective: "18 October 2026", updated: "18 October 2026", iso: "2026-10-18" });
});

it("serves all 48 sections, dates, anchors and the complete closing declaration in semantic HTML", () => {
  const html = renderToStaticMarkup(createElement(PrivacyPage));
  expect(html.match(/<h1\b/g)).toHaveLength(1);
  expect(html.match(/<h2\b/g)).toHaveLength(48);
  expect(html.match(/<time dateTime="2026-10-18"/g)).toHaveLength(2);
  for (const section of privacyPolicySections) {
    expect(html).toContain(`id="${section.id}"`);
    expect(html).toContain(`href="#${section.id}"`);
    expect(html).toContain(section.title);
    expect(html).toContain(`aria-labelledby="${section.id}-title"`);
  }
  expect(html).toContain("rather than bundled into the mandatory application declaration.");
  expect(html).toContain("normally be retained for up to <strong>24 months</strong>");
  expect(html).toContain("<strong>12 months after the relevant recruitment process closes</strong>");
  expect(html).toContain("<strong>90 days</strong>");
  expect(html).toContain("Talent-pool opt-in, AI-assisted candidate evaluation and optional analytics are not implemented.");
  expect(html).not.toMatch(/Draft|owner review required|Insert official|awaiting confirmation|DEMO|fixenmedia@gmail\.com|privacy@fixenmedia\.com/i);
  expect(metadata.description).not.toMatch(/draft/i);
});

it("uses the approved public contacts independently of an unrelated environment contact override", () => {
  vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", "unrelated@example.com");
  try {
    const html = renderToStaticMarkup(createElement(PrivacyPage));
    for (const email of ["hr@fixenmedia.com", "contact@fixenmedia.com", "hiring@accoraze.com"]) expect(html).toContain(`href="mailto:${email}"`);
    expect(html).toContain("backup for all recruitment, not exclusively Accoraze recruitment");
    expect(html).toContain("Textile, Bayezid, East Nasriabad, Chittagong, Bangladesh, 4209");
    expect(html).not.toContain("unrelated@example.com");
  } finally { vi.unstubAllEnvs(); }
});

it("keeps the shared footer privacy link on the real public policy route", () => {
  const html = renderToStaticMarkup(createElement(PublicFooter, { brands: [] }));
  expect(html).toMatch(/<a[^>]*href="\/privacy"[^>]*>Privacy<\/a>/);
});
