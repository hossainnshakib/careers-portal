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

it("preserves the reviewed current-processing policy and sequential section numbering", () => {
  // Reviewed text pin after the owner's current-processing-only cleanup request.
  const content = normalize(`${privacyPolicyIntroduction}\n${privacyPolicySectionsMarkdown}`);
  expect(createHash("sha256").update(content).digest("hex")).toBe("41bd3b34f1094cb37ecc4c88c45d39520c2a78ca43a00f177a6ed94b391a6cf3");
  expect(privacyPolicySections.map(section => section.number)).toEqual(Array.from({ length: 44 }, (_, i) => i + 1));
  expect(privacyPolicyDates).toEqual({ effective: "18 October 2026", updated: "18 October 2026", iso: "2026-10-18" });
});

it("serves all 44 sections, dates, anchors and the closing declaration in semantic HTML", () => {
  const html = renderToStaticMarkup(createElement(PrivacyPage));
  expect(html.match(/<h1\b/g)).toHaveLength(1);
  expect(html.match(/<h2\b/g)).toHaveLength(44);
  expect(html.match(/<time dateTime="2026-10-18"/g)).toHaveLength(2);
  for (const section of privacyPolicySections) {
    expect(html).toContain(`id="${section.id}"`);
    expect(html).toContain(`href="#${section.id}"`);
    expect(html).toContain(section.title);
    expect(html).toContain(`aria-labelledby="${section.id}-title"`);
  }
  expect(html).toContain("information submitted by them is accurate to the best of their knowledge.");
  expect(html).toContain("<strong>12 months after the relevant recruitment process closes</strong>");
  expect(html).toContain("<strong>90 days</strong>");
  expect(html).toContain("Retention is currently managed through manual review and deletion. Submitted applications do not expire automatically.");
  expect(html).not.toMatch(/Draft|owner review required|Insert official|awaiting confirmation|DEMO|fixenmedia@gmail\.com|privacy@fixenmedia\.com/i);
  expect(metadata.description).not.toMatch(/draft/i);
});

it("removes obsolete topics from the entire policy and metadata without a standalone notice", () => {
  const html = renderToStaticMarkup(createElement(PrivacyPage));
  const prohibited = /\bAI\b|artificial intelligence|\bautomated\b|talent[ -]?pools?|\bfuture\b|unimplemented|not implemented|\banalytics\b|optional cookies|cookie preferences|24 months/i;
  expect(`${privacyPolicyIntroduction}\n${privacyPolicySectionsMarkdown}`).not.toMatch(prohibited);
  expect(html).not.toMatch(prohibited);
  expect(JSON.stringify(metadata)).not.toMatch(prohibited);
  expect(html).not.toContain("Current portal operation");
  expect(html).not.toContain("<aside");
  for (const provider of ["Supabase", "Vercel", "Cloudflare Turnstile"]) expect(html).toContain(provider);
  expect(privacyPolicySections.find(section => section.title === "19. Data Retention")?.text).toContain("manual review and deletion");
  expect(privacyPolicySections.find(section => section.title === "26. Authentication Cookies")?.text).toContain("signed-in session");
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
