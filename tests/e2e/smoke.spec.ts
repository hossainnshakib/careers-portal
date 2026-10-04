import { expect, test } from "@playwright/test";

test("health endpoint contains no environment details", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
});

test("foundation home has an accessible heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Good work starts here." })).toBeVisible();
});
