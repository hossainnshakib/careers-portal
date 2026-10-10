import { test, expect } from "../support/admin-fixture";

test.use({ trace: "off" });

test("brand deep-link with ?brand= scrolls to #roles and shows filtered chips", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.evaluate(() => sessionStorage.removeItem("careers-scrolled-once"));
  await page.goto("/?brand=fixen-media");
  await expect(page.getByRole("status")).toBeVisible();
  const statusText = await page.getByRole("status").textContent()!;
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBeGreaterThan(100);
  await expect(page.getByRole("button", { name: /Remove Brand filter: Fixen Media/ })).toBeVisible();
  const filteredCount = Number(statusText!.match(/(\d+) open/)?.[1] ?? "0");
  expect(filteredCount).toBeGreaterThan(0);
  expect(filteredCount).toBeLessThan(20);
});

test("our scroll effect does not re-fire on later filter changes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // Instrument scrollIntoView so we can detect our effect firing.
  await page.addInitScript(() => {
    (window as unknown as Record<string, unknown>).__sivCalls = [] as string[];
    const orig = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (...args: unknown[]) {
      ((window as unknown as Record<string, unknown>).__sivCalls as string[]).push(this.id || this.tagName);
      return (orig as (...a: unknown[]) => void).apply(this, args);
    };
  });
  await page.goto("/");
  await page.waitForTimeout(800);
  await page.evaluate(() => { ((window as unknown as Record<string, unknown>).__sivCalls as string[]) = []; });
  const brandPill = page.getByTestId("home-filter-panel").getByRole("button", { name: "Fixen Media" });
  await expect(brandPill).toBeVisible();
  await brandPill.click();
  await page.waitForTimeout(500);
  // Our effect must not call scrollIntoView. (The browser may still natively
  // scroll to keep the focused pill visible after the results shrink — that is
  // browser focus-restore, not our scroll code.)
  const calls = await page.evaluate(() => ((window as unknown as Record<string, unknown>).__sivCalls as string[]));
  expect(calls).toEqual([]);
});

test("reduced motion uses instant scroll on deep-link", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await page.evaluate(() => sessionStorage.removeItem("careers-scrolled-once"));
  await page.goto("/?brand=doshok");
  await page.waitForTimeout(200);
  const scrolled = await page.evaluate(() => window.scrollY);
  expect(scrolled).toBeGreaterThan(0);
  await context.close();
});
