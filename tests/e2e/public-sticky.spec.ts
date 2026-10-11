import type { Locator, Page } from "@playwright/test";
import { test, expect } from "../support/admin-fixture";
import { completeAdminMfa } from "../support/mfa-login";

test.use({ trace: "off" });

async function proveSticky(page: Page, panel: Locator, container: Locator, content: Locator) {
  await page.evaluate(() => document.fonts.ready);
  await expect(panel).toHaveCSS("position", "sticky");
  // Check every ancestor: decorative clipping must not create a scroll container.
  const badAncestors = await panel.evaluate(element => {
    const bad: string[] = [];
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      if (["hidden", "auto", "scroll", "clip"].includes(getComputedStyle(parent).overflowY)) bad.push(parent.tagName);
    }
    return bad;
  });
  expect(badAncestors).toEqual([]);
  const bounds = await container.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY, height: rect.height };
  });
  const panelHeight = (await panel.boundingBox())!.height;
  expect(panelHeight).toBeLessThanOrEqual(page.viewportSize()!.height - 96 - 24 + 1);
  expect(bounds.height).toBeGreaterThan(panelHeight + 700);
  const contentTops: number[] = [];
  const panelTops: number[] = [];
  for (const extra of [200, 550]) {
    await page.evaluate(y => window.scrollTo(0, y), bounds.top + extra);
    await expect.poll(async () => Math.abs((await panel.boundingBox())!.y - 96)).toBeLessThanOrEqual(3);
    panelTops.push((await panel.boundingBox())!.y);
    contentTops.push((await content.boundingBox())!.y);
  }
  expect(contentTops[0] - contentTops[1]).toBeGreaterThan(300);
  // A short footer can leave insufficient natural scroll range to observe release.
  // Extend only the document AFTER the footer; panel/grid geometry is untouched.
  const releaseTarget = bounds.bottom - panelHeight + 150;
  const addedScrollRoom = await page.evaluate(target => {
    if (document.documentElement.scrollHeight - window.innerHeight >= target) return false;
    const spacer = document.createElement("div");
    spacer.id = "sticky-test-scroll-room"; spacer.setAttribute("aria-hidden", "true");
    spacer.style.height = `${window.innerHeight + 256}px`; document.body.append(spacer);
    return true;
  }, releaseTarget);
  try {
    await page.evaluate(y => window.scrollTo(0, y), releaseTarget);
    await expect.poll(async () => (await panel.boundingBox())!.y).toBeLessThan(-100);
    const endPanel = (await panel.boundingBox())!;
    const endContainer = (await container.boundingBox())!;
    const footer = (await page.getByRole("contentinfo").boundingBox())!;
    expect(endPanel.y + endPanel.height).toBeLessThanOrEqual(endContainer.y + endContainer.height + 2);
    expect(endPanel.y + endPanel.height).toBeLessThanOrEqual(footer.y);
    test.info().annotations.push({ type: "sticky-measurements", description: JSON.stringify({ viewport: page.viewportSize(), panelTops, contentTops, endTop: endPanel.y, panelHeight, addedScrollRoom }) });
  } finally { await page.evaluate(() => document.getElementById("sticky-test-scroll-room")?.remove()); }
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }]) {
  test(`Public header stays sticky at top after scroll at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.emulateMedia({ reducedMotion: "reduce" });
    const header = page.getByTestId("public-header");
    await expect(header).toHaveCSS("position", "sticky");
    await expect(header).toHaveCSS("top", "0px");
    await page.evaluate(() => window.scrollTo(0, 600));
    const headerBox = (await header.boundingBox())!;
    expect(headerBox.y).toBeGreaterThanOrEqual(0);
    expect(headerBox.y).toBeLessThanOrEqual(4);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(header).toHaveCSS("position", "static");
  });

  test(`Home filter stays sticky and bounded at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.emulateMedia({ reducedMotion: "reduce" });
    const panel = page.getByTestId("home-filter-panel");
    if (viewport.height === 900) {
      await page.evaluate(() => document.fonts.ready);
      expect(await panel.evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(2);
    }
    await proveSticky(page, panel, page.getByTestId("roles-grid"), page.getByTestId("roles-grid").locator("section").first());
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(panel).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Filters", exact: true })).toBeVisible();
    await expect(panel).toHaveCSS("position", "static");
    await page.setViewportSize({ width: 900, height: 900 });
    await expect(panel).toHaveCSS("position", "sticky");
  });

  test(`Job summary stays sticky and bounded at ${viewport.width}x${viewport.height}`, async ({ page, publicFixture }) => {
    test.setTimeout(180000);
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(publicFixture.email); await page.getByLabel("Password").fill(publicFixture.password);
    await page.getByRole("button", { name: "Sign in" }).click(); await completeAdminMfa(page, publicFixture);
    await page.goto(`/admin/jobs/${publicFixture.job.id}/edit`);
    // The synthetic fixture stores negotiable salary with no range text.
    // Check the hydrated editor before changing anything, not only SSR markup.
    await expect(page.getByRole("radio", { name: "Negotiable", exact: true })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Show a range", exact: true })).not.toBeChecked();
    await expect(page.getByLabel("Salary range", { exact: true })).toHaveCount(0);
    await page.getByLabel("Description (Markdown)", { exact: true }).fill("A thoughtful role with meaningful work and clear responsibilities.\n\n".repeat(100));
    await Promise.all([
      page.waitForEvent("framenavigated", { predicate: frame => frame === page.mainFrame() }),
      page.getByRole("button", { name: "Save changes", exact: true }).click(),
    ]);
    await expect(page.getByRole("button", { name: "Save changes", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Sign out" }).click(); await expect(page).toHaveURL(/\/admin\/login/);
    await page.setViewportSize(viewport);
    await page.goto(`/jobs/${publicFixture.job.slug}`);
    const panel = page.getByTestId("job-summary-panel");
    await proveSticky(page, panel, page.getByTestId("job-detail-grid"), page.getByTestId("job-detail-grid").locator("section").first());
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(panel).toHaveCSS("position", "static");
    await page.setViewportSize({ width: 900, height: 900 });
    await expect(panel).toHaveCSS("position", "sticky");
  });
}
