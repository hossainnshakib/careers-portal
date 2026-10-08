import { expect, test } from "@playwright/test";

test("public keyboard navigation, modal focus restoration and security headers", async ({ page }) => {
  const response = await page.goto("/");
  const headers = response!.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).toContain("'nonce-");
  if (process.env.PLAYWRIGHT_PRODUCTION === "1") expect(headers["content-security-policy"]).not.toContain("unsafe-eval");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  const opener = page.getByRole("button", { name: "Filters", exact: true });
  await opener.focus(); await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Job filters" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape"); await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});
