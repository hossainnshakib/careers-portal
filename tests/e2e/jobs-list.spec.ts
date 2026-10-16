import { test, expect } from "../support/admin-fixture";
import { completeAdminMfa } from "../support/mfa-login";

test.use({ trace: "off" });
test("admin jobs list filters by URL and shows an empty result", async ({ page, adminAccount }) => {
  test.setTimeout(90000);
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(adminAccount.email);
  await page.getByLabel("Password", { exact: true }).fill(adminAccount.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeAdminMfa(page, adminAccount);
  await expect(page).toHaveURL(/\/admin$/, { timeout: 30000 });
  await page.getByRole("link", { name: "Jobs", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Jobs", exact: true })).toBeVisible();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const trigger = page.getByRole("button", { name: /^Actions for/ }).first();
    await trigger.click();
    await expect(page.locator(".admin-menu-panel a")).toBeFocused();
    await expect(page.locator(".admin-menu-panel").getByRole("button", { name: "Duplicate", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(page.locator(".admin-menu-panel")).toHaveCount(0);
    await trigger.click();
    await page.getByRole("heading", { name: "Jobs", exact: true }).click();
    await expect(page.locator(".admin-menu-panel")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByLabel("Status", { exact: true }).selectOption("draft");
  await page.getByLabel("Search", { exact: true }).fill(adminAccount.prefix);
  await page.getByRole("button", { name: "Filter jobs", exact: true }).click();
  await expect(page).toHaveURL(/status=draft/);
  await expect(page.getByText("No jobs match these filters.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Clear filters", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/jobs$/);
});
