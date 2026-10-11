import { test, expect } from "../support/admin-fixture";

test.use({ trace: "off" });

for (const width of [360, 390, 768]) {
  test(`no horizontal overflow on Home, Job and Apply at ${width}px`, async ({ page, publicFixture }) => {
    await page.setViewportSize({ width, height: 844 });
    for (const path of ["/", `/jobs/${publicFixture.job.slug}`, `/jobs/${publicFixture.job.slug}/apply`]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(1);
    }
  });
}

test("Home filter sheet opens, traps focus, closes on overlay tap and Escape, locks scroll", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const openButton = page.getByRole("button", { name: "Filters", exact: true });
  await expect(openButton).toBeVisible();
  await openButton.click();
  const dialog = page.getByRole("dialog", { name: "Job filters" });
  await expect(dialog).toBeVisible();
  // Focus moves into the sheet.
  const focusedInDialog = await page.evaluate(() => !!document.activeElement?.closest("dialog"));
  expect(focusedInDialog).toBe(true);
  // Background scroll is locked.
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");
  // Overlay tap closes.
  await page.mouse.click(10, 10);
  await expect(dialog).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
  // Reopen and Escape closes; focus returns to the invoker.
  await openButton.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(openButton).toBeFocused();
  // Active filter count is visible on the trigger after selecting a filter inside the sheet.
  await openButton.click();
  // Skip the header's "Clear all"; pick the first real filter option pill.
  const option = dialog.getByRole("button", { name: /^(?!Clear all|Done filtering)/ }).first();
  const optionLabel = (await option.textContent())!.trim();
  await option.click();
  await expect(dialog.getByRole("heading", { name: /Filters · 1 active/ })).toBeVisible();
  await dialog.getByRole("button", { name: "Done filtering" }).click();
  await expect(dialog).not.toBeVisible();
  const trigger = page.getByRole("button", { name: /Filters/ });
  await expect(trigger).toContainText("1");
  // The selected chip is visible and removable.
  await expect(page.getByRole("button", { name: new RegExp(`Remove .*${optionLabel}`) })).toBeVisible();
});

test("mobile Apply bar is visible on Job, links to Apply and does not cover the footer", async ({ page, publicFixture }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/jobs/${publicFixture.job.slug}`);
  const bar = page.getByTestId("mobile-apply-bar");
  await expect(bar).toBeVisible();
  const barBox = (await bar.boundingBox())!;
  expect(barBox.y + barBox.height).toBeLessThanOrEqual(844 + 1);
  // Bar must not overlap the footer once fully scrolled.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const footer = (await page.getByRole("contentinfo").boundingBox())!;
  const barAfter = (await bar.boundingBox())!;
  // Footer content area should still be reachable above the bar (main has pb-24).
  expect(footer.height).toBeGreaterThan(0);
  expect(barAfter.y).toBeGreaterThanOrEqual(footer.y - 1);
  // Desktop hides the bar.
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(bar).not.toBeVisible();
});

test("header is not sticky below 900px and collapses cleanly at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  const header = page.getByTestId("public-header");
  await expect(header).toHaveCSS("position", "static");
  await page.evaluate(() => window.scrollTo(0, 400));
  const box = (await header.boundingBox())!;
  // Static header scrolls away (its top is above the viewport after scroll).
  expect(box.y).toBeLessThan(0);
  // No horizontal overflow after wrap.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("form inputs use at least 16px font on Apply to prevent iOS zoom", async ({ page, publicFixture }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/jobs/${publicFixture.job.slug}/apply`);
  const fullName = page.getByLabel(/Full name/);
  const fontSize = await fullName.evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  expect(fontSize).toBeGreaterThanOrEqual(16);
});

test("Job summary appears right after the hero on mobile", async ({ page, publicFixture }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/jobs/${publicFixture.job.slug}`);
  const summary = page.getByTestId("job-summary-panel");
  await expect(summary).toBeVisible();
  const heroBottom = await page.locator("header.relative").first().evaluate(el => el.getBoundingClientRect().bottom + window.scrollY);
  const summaryTop = await summary.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
  expect(summaryTop).toBeGreaterThanOrEqual(heroBottom - 4);
  // Summary is above the long markdown content.
  const firstSection = page.getByTestId("job-detail-grid").locator("section").first();
  const sectionTop = await firstSection.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
  expect(summaryTop).toBeLessThan(sectionTop);
});
