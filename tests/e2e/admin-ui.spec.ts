import { test, expect } from "../support/admin-fixture";
import { completeAdminMfa } from "../support/mfa-login";

test.use({ trace: "off" });

test("mobile admin navigation contains focus and filters keep the date timezone", async ({ page, adminAccount }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(adminAccount.email);
  await page.getByLabel("Password", { exact: true }).fill(adminAccount.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/mfa$/);
  const firstDigit = page.getByLabel("Authenticator code", { exact: true });
  await firstDigit.fill("123456");
  for (let index = 2; index <= 6; index++) {
    await expect(page.getByLabel(`Authenticator code digit ${index}`, { exact: true })).toHaveValue(String(index));
  }
  await firstDigit.fill("");
  await firstDigit.fill("1");
  await expect(page.getByLabel("Authenticator code digit 2", { exact: true })).toBeFocused();
  await page.keyboard.press("Backspace");
  await expect(firstDigit).toBeFocused();
  await completeAdminMfa(page, adminAccount);
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  await menu.click();
  const dialog = page.getByRole("dialog", { name: "Admin navigation menu" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close menu" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Sign out", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Close menu" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(menu).toBeFocused();
  await page.goto("/admin/applications?from=2026-10-01&tz=Asia%2FDhaka&status=new");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await expect(page.getByLabel("From date", { exact: true })).toBeVisible();
  const removeStatus = page.getByRole("link", { name: "Status: New — remove filter", exact: true });
  const href = new URL((await removeStatus.getAttribute("href"))!, "http://localhost");
  expect(href.searchParams.get("tz")).toBe("Asia/Dhaka");
  expect(href.searchParams.get("from")).toBe("2026-10-01");
  expect(href.searchParams.has("status")).toBe(false);
  await page.goto("/admin/jobs");
  await expect(page.getByLabel("Search", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const firstJob = page.locator("tbody tr").first();
  const titleBox = await firstJob.locator(".admin-cell-title").boundingBox();
  const brandsBox = await firstJob.locator(".admin-cell-brands").boundingBox();
  expect(titleBox!.y).toBeLessThan(brandsBox!.y);
  await page.goto("/admin/brands");
  await page.getByRole("button", { name: /^Edit / }).first().click();
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(new File(['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"/>'], "dropped.svg", { type: "image/svg+xml" }));
    return data;
  });
  await page.locator(".admin-dropzone").dispatchEvent("drop", { dataTransfer: transfer });
  expect(await page.locator('input[type="file"]').evaluate(input => (input as HTMLInputElement).files?.[0]?.name)).toBe("dropped.svg");
  await transfer.dispose();
});
