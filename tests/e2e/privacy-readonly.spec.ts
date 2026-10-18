import { expect, test } from "@playwright/test";
import { privacyPolicySections } from "../../src/lib/privacy/policy";

// No cloud credentials, Auth/account fixtures, application submission or uploads.
test("full approved policy is server rendered and linked from the shared footer", async ({ page, request }) => {
  const response = await request.get("/privacy");
  expect(response.status()).toBe(200);
  const html = await response.text();
  for (const section of privacyPolicySections) expect(html).toContain(`id="${section.id}"`);
  expect(html).toContain("rather than bundled into the mandatory application declaration.");
  expect(html).not.toMatch(/Draft — owner review required|Insert official business|DEMO|fixenmedia@gmail\.com/);
  await page.goto("/");
  await page.locator("footer").getByRole("link", { name: "Privacy", exact: true }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { name: "Privacy Policy", exact: true })).toBeVisible();
  await expect(page.locator("time")).toHaveText(["18 October 2026", "18 October 2026"]);
  await expect(page.locator("main").getByRole("link", { name: "hr@fixenmedia.com", exact: true })).toHaveAttribute("href", "mailto:hr@fixenmedia.com");
  await expect(page.getByRole("link", { name: "hiring@accoraze.com", exact: true })).toHaveAttribute("href", "mailto:hiring@accoraze.com");
  await expect(page.locator("main")).toContainText("submitted applications do not expire automatically");
});

test("policy contents support keyboard anchors and readable nonoverflowing layouts", async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/privacy");
    const summary = page.locator(".privacy-contents summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    const contents = page.getByRole("navigation", { name: "Privacy policy sections" });
    await expect(contents.getByRole("link")).toHaveCount(48);
    await expect(contents).toBeVisible();
    const target = contents.getByRole("link", { name: "47. Questions, Requests and Complaints", exact: true });
    await target.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#privacy-section-47$/);
    await expect(page.getByRole("heading", { name: "47. Questions, Requests and Complaints", exact: true })).toBeInViewport();
    const layout = await page.evaluate(() => {
      const main = document.querySelector(".privacy-page")!;
      const paragraph = document.querySelector(".privacy-prose p")!;
      return { pageWidth: main.getBoundingClientRect().width, paragraphWidth: paragraph.getBoundingClientRect().width,
        viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        fontSize: parseFloat(getComputedStyle(paragraph).fontSize), lineHeight: parseFloat(getComputedStyle(paragraph).lineHeight) };
    });
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewport);
    expect(layout.fontSize).toBeGreaterThanOrEqual(16);
    expect(layout.lineHeight / layout.fontSize).toBeGreaterThanOrEqual(1.6);
    expect(layout.paragraphWidth).toBeLessThanOrEqual(800);
    if (width === 1440) { expect(layout.pageWidth).toBeGreaterThanOrEqual(960); expect(layout.pageWidth).toBeLessThanOrEqual(1100); }
    await page.locator("#privacy-section-47").getByRole("link", { name: "Back to top", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Privacy Policy", exact: true })).toBeInViewport();
    if (width === 390 || width === 1440) await page.screenshot({ path: test.info().outputPath(`privacy-${width}.png`) });
  }
});
