import { expect, test } from "@playwright/test";

test("public privacy, 404, metadata and reference-only success remain safe", async ({ page, request }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy", exact: true })).toBeVisible();
  await expect(page.getByText("Draft — owner review required.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ask for deletion" })).toBeVisible();
  expect((await request.get("/not-a-real-public-page")).status()).toBe(404);
  await page.goto("/not-a-real-public-page");
  await expect(page.getByRole("link", { name: "Browse open roles", exact: true })).toBeVisible();
  await page.goto("/applied/APP-234567");
  await expect(page.getByRole("heading", { name: "Application submitted" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  expect((await request.get("/applied/not-a-valid-reference")).status()).toBe(404);
  const sitemap = await request.get("/sitemap.xml");
  const xml = await sitemap.text();
  expect(xml).toContain("/privacy"); expect(xml).not.toContain("/applied/"); expect(xml).not.toContain("/admin/");
  await page.goto("/");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Careers/);
});
