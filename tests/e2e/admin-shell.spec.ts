import { expect, test } from "@playwright/test";

test("anonymous admin routes lead to the accessible login form", async ({ page }) => {
  for (const route of ["/admin", "/admin/applications"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole("heading", { name: "Admin sign in" })).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  }
});
