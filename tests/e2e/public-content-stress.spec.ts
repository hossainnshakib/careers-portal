import type { Locator } from "@playwright/test";
import { expect, test } from "../support/admin-fixture";
import { completeAdminMfa } from "../support/mfa-login";
test.use({ trace: "off" });

// Item 6 content stress: the fixture creates one very long/all-sections job
// (near-limit fields, four hiring brands, an 80-character salary line) and one
// Bengali job with no optional sections. Both are deleted by the fixture, so
// the catalog cache is only refreshed here through a real admin save action.
test("stress content: very long titles, four brands, Bengali text and edge-length fields render cleanly", async ({ page, stressFixture }, testInfo) => {
  test.setTimeout(300000);
  const stress = stressFixture.stress;
  if (!stress) throw new Error("Stress fixture jobs were not created");

  // 1. Invalidate the cached public catalog through a real admin save action.
  //    The fixture rows exist in the database, but the 300s unstable_cache
  //    catalog only reveals them after revalidateTag("jobs") in the save action.
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(stressFixture.email);
  await page.getByLabel("Password", { exact: true }).fill(stressFixture.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await completeAdminMfa(page, stressFixture);
  await page.goto(`/admin/jobs/${stress.bengali.id}/edit`);
  await expect(page.getByLabel("Summary", { exact: true })).toHaveValue(stress.bengali.summary);
  const [saved] = await Promise.all([
    page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes(`/admin/jobs/${stress.bengali.id}/edit`)),
    page.waitForEvent("framenavigated", { predicate: (frame) => frame === page.mainFrame() }),
    page.getByRole("button", { name: "Save changes", exact: true }).click(),
  ]);
  expect(saved.ok()).toBe(true);
  await expect(page.getByRole("button", { name: "Save changes", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/admin\/login/);

  const expectNoOverflow = async (label: string) => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${label}: the page must not scroll horizontally`).toBeLessThanOrEqual(1);
  };
  const expectWraps = async (locator: Locator, label: string) => {
    const clipped = await locator.evaluate((element) => element.scrollWidth > element.clientWidth + 1);
    expect(clipped, `${label}: text must wrap instead of clipping`).toBe(false);
  };
  const roles = () => page.getByRole("region", { name: "Open roles", exact: true });
  const longCard = () => roles().getByRole("link").filter({ hasText: stress.long.title });
  const bengaliCard = () => roles().getByRole("link").filter({ hasText: stress.bengali.title });

  // 2. Home at four widths: both stress jobs render, the very long card title
  //    wraps inside its column instead of clipping, and nothing overflows.
  for (const width of [1440, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(longCard()).toBeVisible();
    await expect(bengaliCard()).toBeVisible();
    await expect(longCard().locator("h3")).toHaveText(stress.long.title);
    await expectWraps(longCard().locator("h3"), `Home card title at ${width}px`);
    await expectNoOverflow(`Home at ${width}px`);
    if (width === 1440 || width === 390) await page.screenshot({ path: testInfo.outputPath(`home-${width}.png`), fullPage: true });
  }

  // 3. Bengali typed into the search field filters the catalog down to the
  //    Bengali job and renders in the search chip.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByLabel("Search roles").fill("বাংলা");
  await expect(roles().getByRole("link")).toHaveCount(1);
  await expect(bengaliCard()).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove search filter" })).toContainText("বাংলা");
  await expectNoOverflow("Home with a Bengali search at 1440px");
  await page.getByLabel("Search roles").fill("");
  await expect(longCard()).toBeVisible();

  // 4. Long/all-sections job: four hiring brands, every section rendered, the
  //    80-character salary line in the summary panel, a long markdown URL and
  //    near-limit pills, all without overflow at desktop and mobile widths.
  await page.goto(`/jobs/${stress.long.slug}`);
  await expect(page.getByRole("heading", { level: 1, name: stress.long.title })).toBeVisible();
  await expect(page.locator('[aria-label="Hiring brands"] img')).toHaveCount(3); // three marks + a "+1" chip for the fourth
  await expect(page.locator("main img")).toHaveCount(7); // 3 hero logos + 4 "Who you would work with" logos
  for (const heading of ["Why this role exists", "Key responsibilities", "Requirements", "What keeps you ahead"]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
  const skills = page.locator("section").filter({ has: page.getByRole("heading", { name: "Skills and areas of expertise" }) }).locator("li");
  await expect(skills).toHaveCount(20);
  const benefits = page.locator("section").filter({ has: page.getByRole("heading", { name: "Compensation & benefits" }) }).locator("li");
  await expect(benefits).toHaveCount(12);
  await expect(page.getByRole("link", { name: "https://example.com/hiring/platform/guidelines/2026/cross-brand-design-system-and-application-flow" })).toBeVisible();
  const summaryPanel = page.getByTestId("job-summary-panel");
  await expect(summaryPanel).toContainText(stress.long.salaryText);
  await expect(summaryPanel).toContainText("Vacancy");
  await expect(summaryPanel).toContainText("Deadline");
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expectWraps(page.getByRole("heading", { level: 1, name: stress.long.title }), `Job h1 at ${width}px`);
    await expectNoOverflow(`Long job at ${width}px`);
    await page.screenshot({ path: testInfo.outputPath(`job-long-${width}.png`), fullPage: true });
  }

  // 5. Bengali job: no optional sections, Bengali markdown and salary in the
  //    summary panel, and Hind Siliguri renders every glyph with no fallback.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/jobs/${stress.bengali.slug}`);
  await expect(page.getByRole("heading", { level: 1, name: stress.bengali.title })).toBeVisible();
  await expect(page.getByText(stress.bengali.summary, { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "ভূমিকা" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What keeps you ahead" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Skills and areas of expertise" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Compensation & benefits" })).toHaveCount(0);
  const bengaliPanel = page.getByTestId("job-summary-panel");
  await expect(bengaliPanel).toContainText(stress.bengali.salaryText);
  await expect(bengaliPanel.getByText("Vacancy", { exact: true })).toHaveCount(0);
  await expect(bengaliPanel.getByText("Deadline", { exact: true })).toHaveCount(0);
  await expect(bengaliPanel.getByText("Negotiable", { exact: true })).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready.then(() => true));
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: "h1" });
  const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
  const families = fonts.map((font) => font.familyName);
  expect(families.length, "The Bengali h1 must render with web fonts").toBeGreaterThan(0);
  // A missing glyph would fall back to an installed system font (isCustomFont false).
  for (const font of fonts) {
    expect(font.isCustomFont, `Unexpected system fallback font "${font.familyName}" for the Bengali h1: ${JSON.stringify(fonts)}`).toBe(true);
    expect(/^(Hind Siliguri|Plus Jakarta Sans)/.test(font.familyName), `Unexpected font "${font.familyName}" for the Bengali h1: ${JSON.stringify(fonts)}`).toBe(true);
  }
  expect(fonts.find((font) => font.familyName === "Hind Siliguri")?.glyphCount ?? 0, `Bengali script must render with Hind Siliguri: ${JSON.stringify(fonts)}`).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.fonts.check('16px "Hind Siliguri"', "বাংলা"))).toBe(true);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expectWraps(page.getByRole("heading", { level: 1, name: stress.bengali.title }), `Bengali job h1 at ${width}px`);
    await expectNoOverflow(`Bengali job at ${width}px`);
    await page.screenshot({ path: testInfo.outputPath(`job-bengali-${width}.png`), fullPage: true });
  }

  // 6. Apply pages: Bengali typed into the contact field and a Bengali-labelled
  //    question is retained, and the long job's upload widget never overflows.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/jobs/${stress.bengali.slug}/apply`);
  const fullName = page.getByLabel("Full name", { exact: true });
  const answer = page.getByLabel(stress.bengali.questionLabel, { exact: true });
  const typedName = "শ্রী ক্ষিতিশ চক্রবর্তী";
  const typedAnswer = "২০২৬ সালে আমি পাঁচটি বাংলা প্রজেক্ট সম্পন্ন করেছি।";
  await fullName.fill(typedName);
  await answer.fill(typedAnswer);
  await expect(fullName).toHaveValue(typedName);
  await expect(answer).toHaveValue(typedAnswer);
  await expect(page.getByRole("region", { name: "CV (optional) upload", exact: true })).toBeVisible();
  await expectNoOverflow("Bengali apply with typed answers at 390px");
  await page.screenshot({ path: testInfo.outputPath("apply-bengali-390.png"), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await expectNoOverflow("Bengali apply at 1440px");

  await page.goto(`/jobs/${stress.long.slug}/apply`);
  await expect(page.getByLabel("Which city are you based in?", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "CV * upload", exact: true })).toBeVisible();
  await expectNoOverflow("Long job apply at 1440px");
  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoOverflow("Long job apply at 390px");
  await page.screenshot({ path: testInfo.outputPath("apply-long-390.png"), fullPage: true });
});
